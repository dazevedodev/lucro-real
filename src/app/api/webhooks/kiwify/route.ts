import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCredentialsEmail } from "@/lib/email";

// A doc pública da Kiwify (docs.kiwify.com.br) documenta bem os triggers
// disponíveis ("compra_aprovada" etc.) e que cada webhook tem um `token`,
// mas não deixa claro o shape exato do payload de evento nem onde o token
// é enviado de volta na requisição. Por isso:
// - validamos um segredo nosso via querystring (?token=...), já que É a
//   gente quem cola a URL do webhook no dashboard da Kiwify — assim não
//   dependemos de como a Kiwify propaga o token dela;
// - a extração de e-mail/status é defensiva (tenta vários caminhos comuns)
//   e o payload cru sempre é logado, pra ajustar com o primeiro teste real
//   disparado pelo botão "testar webhook" do dashboard da Kiwify.
function generateTempPassword() {
  return randomBytes(9).toString("base64url"); // ~12 chars, url-safe
}

// Modelo de negócio: pagamento único dá acesso por 1 ano, não vitalício.
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function safeCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!secret) return false;
  const fromQuery = request.nextUrl.searchParams.get("token");
  const fromHeader = request.headers.get("x-webhook-secret");
  return (!!fromQuery && safeCompare(fromQuery, secret)) || (!!fromHeader && safeCompare(fromHeader, secret));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEmail(body: any): string | null {
  const candidates = [
    body?.email,
    body?.data?.email,
    body?.data?.Customer?.email,
    body?.data?.customer?.email,
    body?.Customer?.email,
    body?.customer?.email,
    body?.data?.buyer?.email,
  ];
  const found = candidates.find((v) => typeof v === "string" && v.includes("@"));
  return found ?? null;
}

const APPROVED_STATUS_HINTS = ["paid", "approved", "aprovad", "completed"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractStatus(body: any): string | null {
  const value =
    body?.order_status ?? body?.status ?? body?.data?.order_status ?? body?.data?.status ?? body?.webhook_event_type ?? body?.type ?? null;
  return typeof value === "string" ? value : null;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  console.log("[kiwify webhook] payload recebido:", JSON.stringify(body));

  const status = extractStatus(body);
  const looksApproved =
    status === null || APPROVED_STATUS_HINTS.some((hint) => status.toLowerCase().includes(hint));

  if (!looksApproved) {
    return NextResponse.json({ ok: true, skipped: true, reason: `status não aprovado: ${status}` });
  }

  const email = extractEmail(body)?.trim().toLowerCase();
  if (!email) {
    console.error("[kiwify webhook] não encontrei e-mail no payload — ver log acima e ajustar extractEmail()");
    return NextResponse.json({ error: "email não encontrado no payload" }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  let userId: string;

  if (error || !data.user) {
    // Webhooks costumam reentregar em caso de timeout/erro, e o mesmo
    // comprador pode recomprar — nesses casos createUser falha com "já
    // existe". Em vez de travar, reemite uma senha temporária pro usuário
    // existente (achado via profiles.email, sincronizado pelo trigger
    // handle_new_user) em vez de deixar a compra sem acesso.
    const isDuplicate = error?.code === "email_exists" || /already registered|already exists/i.test(error?.message ?? "");
    if (!isDuplicate) {
      return NextResponse.json(
        { error: error?.message ?? "não foi possível criar o acesso" },
        { status: 400 }
      );
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!existingProfile) {
      return NextResponse.json({ error: "conta já existe mas não encontrei o profile" }, { status: 400 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(existingProfile.id, {
      password: tempPassword,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Recompra/renovação: reemitir credenciais também renova o acesso por
    // mais 1 ano a partir de agora (o produto é pago uma vez por período,
    // não vitalício).
    const newExpiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();
    await admin
      .from("profiles")
      .update({ must_change_password: true, access_expires_at: newExpiresAt })
      .eq("id", existingProfile.id);
    userId = existingProfile.id;
  } else {
    userId = data.user.id;
  }

  const emailResult = await sendCredentialsEmail({ to: email, tempPassword });
  if (!emailResult.sent) {
    console.log(
      `[kiwify webhook] Acesso criado/reemitido para ${email} — senha temporária: ${tempPassword} (e-mail não enviado: ${emailResult.reason})`
    );
  }

  return NextResponse.json({ ok: true, userId, emailSent: emailResult.sent });
}
