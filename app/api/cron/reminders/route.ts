import { NextResponse } from "next/server";
import { getContracts as getContractsSupabase, getMilestones as getMilestonesSupabase } from "@/lib/storageSupabase";
import { getContracts as getContractsLocal, getMilestones as getMilestonesLocal } from "@/lib/storage";
import { sendSimulatedEmail } from "@/lib/emails";
import { addAuditLog as addAuditLogSupabase } from "@/lib/storageSupabase";
import { addAuditLog as addAuditLogLocal } from "@/lib/storage";
import { Contract, Milestone, AuditLog } from "@/lib/types";

export async function GET() {
  try {
    // Check if Supabase is active
    const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    let contracts: Contract[] = [];
    let getMilestonesFn: (contractId: string) => Promise<Milestone[]>;
    let addAuditLogFn: (params: Omit<AuditLog, "id" | "timestamp">) => Promise<unknown>;

    if (useSupabase) {
      console.log("⏱️ Cron Reminders: Using Supabase storage adapter");
      contracts = await getContractsSupabase();
      getMilestonesFn = getMilestonesSupabase;
      addAuditLogFn = addAuditLogSupabase;
    } else {
      console.log("⏱️ Cron Reminders: Using local JSON storage adapter");
      contracts = await getContractsLocal();
      getMilestonesFn = getMilestonesLocal;
      addAuditLogFn = addAuditLogLocal;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentReminders = [];

    for (const contract of contracts) {
      // Only process active contracts
      if (contract.status !== "accepted") continue;

      const milestones = await getMilestonesFn(contract.id);
      for (const milestone of milestones) {
        if (milestone.status !== "pending" && milestone.status !== "requested") continue;

        const dueDate = new Date(milestone.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Trigger reminder if milestone is due in exactly 3 days
        if (diffDays === 3) {
          const tokenPart = contract.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
          const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${contract.id}${tokenPart}`;

          console.log(`⏰ Cron Reminders: Milestone "${milestone.label}" (ID: ${milestone.id}) is due in 3 days. Sending email reminder.`);

          await sendSimulatedEmail({
            to: contract.clientEmail,
            subject: `Recordatorio de Pago: Hito "${milestone.label}" vence en 3 días`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #e11d48; margin-top: 0;">Recordatorio de Vencimiento</h2>
                <p>Hola <strong>${contract.clientName}</strong>,</p>
                <p>Te recordamos que el hito <strong>"${milestone.label}"</strong> vence en 3 días (<strong>${milestone.dueDate}</strong>).</p>
                <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; color: #9f1239;"><strong>Detalles del Pago:</strong></p>
                  <p style="margin: 0 0 6px 0;">Monto: ${milestone.amount} ${contract.currency}</p>
                  <p style="margin: 0;">Fecha Límite: ${milestone.dueDate}</p>
                </div>
                <p style="margin-bottom: 25px;">Por favor realiza tu transferencia bancaria y reporta tu comprobante ingresando al siguiente enlace seguro:</p>
                <p style="text-align: center;">
                  <a href="${clientUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Pagar e Ingresar Comprobante</a>
                </p>
              </div>
            `
          });

          try {
            await addAuditLogFn({
              contractId: contract.id,
              action: "milestone_requested",
              actor: "system",
              details: `Recordatorio automático enviado al cliente para el hito "${milestone.label}" (Vence en 3 días).`
            });
          } catch (e) {
            console.error("Failed to add audit log for reminder:", e);
          }

          sentReminders.push({
            contractId: contract.id,
            clientEmail: contract.clientEmail,
            milestoneId: milestone.id,
            milestoneLabel: milestone.label,
            dueDate: milestone.dueDate
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedContracts: contracts.length,
      sentRemindersCount: sentReminders.length,
      sentReminders
    });
  } catch (err: unknown) {
    console.error("Cron reminders error:", err);
    const errMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
