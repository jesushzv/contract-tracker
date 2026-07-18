import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
  Text,
  Button
} from "@react-email/components";
import * as React from "react";

interface CampaignEmailProps {
  subject: string;
  bodyText: string;
  actionUrl?: string;
  actionText?: string;
}

export const CampaignEmail = ({
  subject = "Actualización de Tracker",
  bodyText = "Mensaje",
  actionUrl,
  actionText = "Ver más",
}: CampaignEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Tailwind>
        <Body className="bg-[#f6f9fc] font-sans my-auto mx-auto px-2">
          <Container className="border border-solid border-[#e6ebf1] rounded my-[40px] mx-auto p-[20px] max-w-[600px] bg-white">
            <Heading className="text-[#1f2937] text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              {subject}
            </Heading>
            <Text className="text-[#374151] text-[16px] leading-[24px] whitespace-pre-wrap">
              {bodyText}
            </Text>
            
            {actionUrl && (
              <Container className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#4f46e5] rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                  href={actionUrl}
                >
                  {actionText}
                </Button>
              </Container>
            )}

            <Text className="text-[#6b7280] text-[12px] leading-[24px] mt-[40px]">
              El Equipo de Mi Pacto
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CampaignEmail;
