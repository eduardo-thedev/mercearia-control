import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "Mercearia Lima <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Sem RESEND_API_KEY configurada (ex: rodando local sem essa integracao
// montada ainda), cai pro console em vez de falhar - assim da pra testar o
// fluxo de reset de senha inteiro sem depender do Resend estar configurado.
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[email] RESEND_API_KEY nao configurada. Link de reset pra ${to}:\n${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: emailFrom,
    to,
    subject: "Redefinir sua senha - Mercearia Lima",
    html: `
      <p>Voce pediu pra redefinir sua senha no Mercearia Lima.</p>
      <p><a href="${resetUrl}">Clique aqui pra criar uma nova senha</a></p>
      <p>Esse link expira em 1 hora. Se voce nao pediu isso, pode ignorar este e-mail.</p>
    `,
  });
}
