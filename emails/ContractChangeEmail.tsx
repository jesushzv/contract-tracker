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

interface ContractChangeEmailProps {
  recipientName: string;
  senderName: string;
  contractUrl: string;
  actionMessage: string;
  details?: string;
}

export const ContractChangeEmail = ({
  recipientName = "Usuario",
  senderName = "Sistema",
  contractUrl = "https://contract-tracker.app",
  actionMessage = "ha actualizado el estado del contrato",
  details = "",
}: ContractChangeEmailProps) => (
  <Html>
    <Head />
    <Preview>Actualización sobre tu contrato de servicios</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Actualización del Contrato</Heading>
        <Text style={text}>
          Hola {recipientName},
        </Text>
        <Text style={text}>
          <strong>{senderName}</strong> {actionMessage}.
        </Text>
        {details && (
          <Text style={text}>
            Detalles adicionales: <br />
            <em>{details}</em>
          </Text>
        )}
        <Text style={text}>
          Puedes revisar los cambios o el estado actual del contrato ingresando a la plataforma:
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={contractUrl}>
            Ver Contrato
          </Button>
        </Section>
        <Text style={footer}>
          Este es un correo automático de Contract Tracker.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ContractChangeEmail;

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
  backgroundColor: "#0f172a",
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
