import ChangePasswordForm from "./ChangePasswordForm";

export default function TrocarSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Defina sua senha</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Você entrou com uma senha temporária. Escolha uma nova senha para continuar.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
