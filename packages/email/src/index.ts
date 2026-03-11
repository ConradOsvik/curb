import { env } from "@curb/env/server";
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? "Curb <noreply@curb.dev>",
    react,
    subject,
    to,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
