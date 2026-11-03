import { Resend } from "resend";

export interface SendCredentialsResult {
  sent: boolean;
  reason?: string;
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Lucro Real <acesso@lucroreal.app.br>";

export async function sendCredentialsEmail(params: {
  to: string;
  tempPassword: string;
}): Promise<SendCredentialsResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Sem chave configurada ainda — comportamento "simulado": quem chamou
    // deve logar as credenciais no console como fallback.
    return { sent: false, reason: "RESEND_API_KEY não configurada" };
  }

  const resend = new Resend(apiKey);
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lucro-real-seven.vercel.app";

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: "Seu acesso ao Lucro Real",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #10B981;">Lucro Real</h1>
        <p>Sua compra foi aprovada! Use os dados abaixo para acessar:</p>
        <p><strong>E-mail:</strong> ${params.to}<br/>
        <strong>Senha temporária:</strong> ${params.tempPassword}</p>
        <p>No primeiro login você vai precisar trocar essa senha por uma de sua escolha.</p>
        <p><a href="${loginUrl}/login" style="color: #10B981;">Entrar agora</a></p>
      </div>
    `,
  });

  if (error) {
    return { sent: false, reason: error.message };
  }
  return { sent: true };
}
