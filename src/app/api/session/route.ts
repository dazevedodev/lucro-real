import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Chamado pelo WebView (NativeBridge) depois do login para repassar as
// credenciais ao plugin nativo da bolha flutuante, que roda fora da WebView
// e por isso não tem acesso aos cookies httpOnly da sessão web.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("lr_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "no active session id" }, { status: 401 });
  }

  return NextResponse.json({
    sessionId,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
