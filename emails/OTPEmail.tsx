import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

interface OTPEmailProps {
  clientName: string;
  otpCode: string;
}

export const OTPEmail = ({
  clientName = "Cliente",
  otpCode = "123456",
}: OTPEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu código de verificación es {otpCode}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Código de Verificación</Heading>
        <Text style={text}>
          Hola {clientName},
        </Text>
        <Text style={text}>
          Utiliza el siguiente código de 6 dígitos para verificar tu identidad y firmar el contrato:
        </Text>
        <Section style={codeBox}>
          <Text style={code}>{otpCode}</Text>
        </Section>
        <Text style={footer}>
          Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OTPEmail;

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
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
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

const codeBox = {
  background: "#f1f5f9",
  borderRadius: "4px",
  margin: "16px 40px",
  padding: "24px",
  textAlign: "center" as const,
};

const code = {
  color: "#0f172a",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "6px",
  margin: "0",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "22px",
  marginTop: "24px",
  padding: "0 40px",
  textAlign: "center" as const,
};
