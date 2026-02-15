import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { COPYRIGHT_HOLDER } from "@/lib/constants";

interface VerificationEmailProps {
  verificationCode: string;
  userName?: string;
  verificationUrl: string;
}

export const VerificationEmail = ({
  verificationCode,
  userName,
  verificationUrl,
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your No Context verification code: {verificationCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with brand logo */}
          <Section style={header}>
            <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
              <tr>
                <td style={{ verticalAlign: "middle", paddingRight: "8px" }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="32"
                      y1="6"
                      x2="32"
                      y2="14"
                      stroke="#7C3AED"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="32" cy="5" r="3" fill="#F97066" />
                    <rect
                      x="12"
                      y="14"
                      width="40"
                      height="32"
                      rx="8"
                      fill="#7C3AED"
                    />
                    <circle cx="24" cy="28" r="5" fill="white" />
                    <circle cx="40" cy="28" r="5" fill="white" />
                    <circle cx="25" cy="27" r="2.5" fill="#1A1A1A" />
                    <circle cx="41" cy="27" r="2.5" fill="#1A1A1A" />
                    <rect
                      x="22"
                      y="37"
                      width="20"
                      height="4"
                      rx="2"
                      fill="#F97066"
                    />
                    <rect
                      x="4"
                      y="24"
                      width="6"
                      height="12"
                      rx="3"
                      fill="#7C3AED"
                      opacity="0.7"
                    />
                    <rect
                      x="54"
                      y="24"
                      width="6"
                      height="12"
                      rx="3"
                      fill="#7C3AED"
                      opacity="0.7"
                    />
                    <rect
                      x="22"
                      y="48"
                      width="20"
                      height="10"
                      rx="4"
                      fill="#7C3AED"
                      opacity="0.5"
                    />
                  </svg>
                </td>
                <td style={{ verticalAlign: "middle" }}>
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    <span style={{ color: "#1A1A1A" }}>no</span>
                    <span style={{ color: "#7C3AED" }}>context</span>
                  </span>
                </td>
              </tr>
            </table>
            <Text style={headerSubtitle}>Turn team quotes into AI art</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Heading style={title}>Verify Your Email Address</Heading>

            <Text style={text}>
              {userName ? `Hi ${userName},` : "Hi there,"}
            </Text>

            <Text style={text}>
              Welcome to No Context! To get started turning your team&apos;s
              funniest quotes into art, please verify your email address by
              clicking the button below:
            </Text>

            {/* Verification Button */}
            <Section style={buttonContainer}>
              <Button href={verificationUrl} style={button}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={text}>
              Or enter this verification code on the verification page:
            </Text>

            {/* Verification Code */}
            <Section style={codeContainer}>
              <Text style={codeLabel}>Your verification code:</Text>
              <Text style={codeText}>{verificationCode}</Text>
            </Section>

            <Text style={text}>
              This code will expire in 15 minutes for security reasons.
            </Text>

            <Text style={text}>
              If you didn&apos;t create an account with No Context, you can
              safely ignore this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by No Context. If you have any questions,
              please contact our support team.
            </Text>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}. All rights
              reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#fafaf8",
  borderBottom: "2px solid #7C3AED",
  textAlign: "center" as const,
};

const headerSubtitle = {
  color: "#4A4A4A",
  fontSize: "14px",
  margin: "12px 0 0 0",
};

const content = {
  padding: "32px 24px",
};

const title = {
  color: "#1A1A1A",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const text = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#7C3AED",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  borderRadius: "10px",
  border: "2px solid #1A1A1A",
};

const codeContainer = {
  backgroundColor: "#fafaf8",
  border: "2px solid #e5e5e5",
  borderRadius: "10px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#4A4A4A",
  fontSize: "14px",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const codeText = {
  color: "#7C3AED",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "6px",
  fontFamily: "monospace",
};

const footer = {
  padding: "24px",
  backgroundColor: "#fafaf8",
  borderTop: "1px solid #e5e5e5",
  textAlign: "center" as const,
};

const footerText = {
  color: "#4A4A4A",
  fontSize: "12px",
  margin: "0 0 8px 0",
};

export default VerificationEmail;
