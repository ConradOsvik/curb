import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OtpEmailProps {
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

function getTitle(type: OtpEmailProps["type"]) {
  if (type === "sign-in") {
    return "Sign in to your account";
  }
  if (type === "email-verification") {
    return "Verify your email address";
  }
  return "Reset your password";
}

function getDescription(type: OtpEmailProps["type"]) {
  if (type === "sign-in") {
    return "Use the code below to sign in to your account.";
  }
  if (type === "email-verification") {
    return "Use the code below to verify your email address.";
  }
  return "Use the code below to reset your password.";
}

export default function OtpEmail({ otp, type }: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your code: {otp}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{getTitle(type)}</Heading>
          <Text style={text}>{getDescription(type)}</Text>
          <Section style={codeSection}>
            <Text style={code}>{otp}</Text>
          </Section>
          <Text style={text}>This code expires in 5 minutes.</Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn&apos;t request this code, you can safely ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

OtpEmail.PreviewProps = {
  otp: "123456",
  type: "email-verification",
} satisfies OtpEmailProps;

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  margin: "40px auto",
  maxWidth: "480px",
  padding: "40px",
};

const heading = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "600" as const,
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 24px",
};

const codeSection = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  margin: "0 0 24px",
  padding: "16px",
  textAlign: "center" as const,
};

const code = {
  color: "#111827",
  fontSize: "32px",
  fontWeight: "700" as const,
  letterSpacing: "0.15em",
  lineHeight: "1",
  margin: "0",
};

const hr = {
  borderColor: "#e0e0e0",
  margin: "24px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};
