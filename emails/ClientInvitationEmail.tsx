import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

interface ClientInvitationEmailProps {
  clientName: string;
  freelancerName: string;
  contractUrl: string;
  amount: string;
  currency: string;
  customMessage?: string;
}

export const ClientInvitationEmail = ({
  clientName = "Cliente",
  freelancerName = "Freelancer",
  contractUrl = "https://mipacto.app",
  amount = "0.00",
  currency = "MXN",
  customMessage,
}: ClientInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>{freelancerName} te ha enviado una propuesta de contrato</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Propuesta de Servicios</Heading>
        <Text style={text}>
          Hola {clientName},
        </Text>
        <Text style={text}>
          <strong>{freelancerName}</strong> te ha enviado una propuesta de contrato por la cantidad de <strong>${amount} {currency}</strong>.
        </Text>
        <Text style={text}>
          Puedes revisar los detalles del contrato, los hitos de pago y firmar electrónicamente de conformidad accediendo al siguiente enlace seguro:
        </Text>
        {customMessage && (
          <Section style={customMessageSection}>
            <Text style={customMessageText}>{customMessage}</Text>
          </Section>
        )}
        <Section style={btnContainer}>
          <Button style={button} href={contractUrl}>
            Revisar y Firmar Contrato
          </Button>
        </Section>
        <Text style={text}>
          Si tienes alguna duda sobre el alcance o los términos, puedes proponer una revisión directamente desde la plataforma.
        </Text>
        <Text style={footer}>
          Este es un correo automático de Mi Pacto.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ClientInvitationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

const h1 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  padding: "20px",
};

const customMessageSection = {
  margin: "24px 40px",
  padding: "16px 20px",
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  borderLeft: "4px solid #3b82f6",
};

const customMessageText = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 40px",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#6A1B9A",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "22px",
  marginTop: "24px",
  padding: "0 40px",
  textAlign: "center" as const,
};
