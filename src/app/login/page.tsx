import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <LoginForm
        reason={reason === "session_replaced" || reason === "access_expired" ? reason : null}
      />
    </div>
  );
}
