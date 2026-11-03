import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createRideForUser } from "@/lib/rides";
import type { Database } from "@/lib/supabase/database.types";

// Endpoint usado pela bolha flutuante nativa (fora da WebView, sem acesso
// aos cookies httpOnly da sessão web) — autentica via Bearer <access_token>
// do Supabase que o app Android guarda depois do login.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!accessToken) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }

  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 401 });
  }

  // Mesma trava de sessão única do web: se outro dispositivo logou depois
  // (sobrescrevendo active_session_id), esta sessão nativa também é negada.
  const sessionId = request.headers.get("x-session-id");
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_session_id, access_expires_at")
    .eq("id", user.id)
    .single();

  if (!sessionId || !profile?.active_session_id || sessionId !== profile.active_session_id) {
    return NextResponse.json({ error: "session_replaced" }, { status: 401 });
  }

  // A bolha nativa guarda o token localmente e não passa pelo proxy.ts —
  // sem essa checagem aqui, o acesso expirado (plano de 1 ano) continuaria
  // funcionando pra sempre pela bolha mesmo depois do login web ser negado.
  if (!profile.access_expires_at || new Date(profile.access_expires_at) < new Date()) {
    return NextResponse.json({ error: "access_expired" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const valueReceived = Number(body?.valueReceived);
  const kmDriven = Number(body?.kmDriven);

  const result = await createRideForUser(supabase, user.id, { valueReceived, kmDriven });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ride: result.ride });
}
