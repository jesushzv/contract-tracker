import Facturapi from "facturapi";

const API_KEY = process.env.FACTURAPI_SECRET_KEY || "";
const facturapi = new Facturapi(API_KEY);

export default facturapi;


export interface InvoiceGenerationPayload {
  facturapiLiveKey: string;
  clientLegalName: string;
  clientRfc: string;
  clientTaxSystem: string;
  clientZip: string;
  clientCfdiUse: string;
  satProductCode: string;
  description: string;
  amount: number;
  taxRegimeType: string;
}

export async function generateInvoice(data: InvoiceGenerationPayload) {
  if (!data.facturapiLiveKey) {
    throw new Error("Missing freelancer's Facturapi Live API Key");
  }
  
  // Instantiate a scoped SDK client for the specific freelancer's organization
  const scopedClient = new Facturapi(data.facturapiLiveKey);
  
  // Calculate taxes based on the selected tax regime
  const taxes = [];
  if (data.taxRegimeType === 'general' || data.taxRegimeType === 'resico') {
    // Standard 16% IVA
    taxes.push({
      type: "IVA",
      rate: 0.16,
      withholding: false
    });
  }
  
  if (data.taxRegimeType === 'resico') {
    // RESICO includes a 1.25% ISR Retention when billing a Persona Moral
    taxes.push({
      type: "ISR",
      rate: 0.0125,
      withholding: true
    });
  }

  // Create the invoice using Facturapi SDK
  const invoice = await scopedClient.invoices.create({
    customer: {
      legal_name: data.clientLegalName,
      tax_id: data.clientRfc,
      tax_system: data.clientTaxSystem,
      address: {
        zip: data.clientZip
      }
    },
    items: [
      {
        product: {
          description: data.description,
          product_key: data.satProductCode || "81111509", // Default if not provided
          price: data.amount,
          taxes: taxes
        }
      }
    ],
    use: data.clientCfdiUse || "G03", // Gastos en general
    payment_form: "03" // Transferencia electrónica de fondos
  });
  
  return {
    id: invoice.id,
    xml_url: `https://facturapi.io/v2/invoices/${invoice.id}/xml`,
    pdf_url: `https://facturapi.io/v2/invoices/${invoice.id}/pdf`,
    status: "valid"
  };
}
