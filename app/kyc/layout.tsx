export default function KycLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-8 sm:px-6">
      <div className="animate-fade-up">{children}</div>
      <p className="mt-6 text-center text-xs text-slate-400">
        🔒 Your information is encrypted and used only for KYC verification.
        <br />© {new Date().getFullYear()} EaseMyOffice
      </p>
    </div>
  );
}
