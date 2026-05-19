export const metadata = {
  title: "Login — Rev Multimedia Academy",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-6">
      <div className="max-w-md w-full rounded-xl border border-white/10 bg-dark-2 p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-white mb-3">
          Admin login
        </h1>
        <p className="text-white/60 text-sm leading-relaxed">
          Sign in with an admin account to manage courses and intakes. Portal
          login will be available in a later phase.
        </p>
      </div>
    </div>
  );
}
