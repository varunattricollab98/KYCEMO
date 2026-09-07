export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          EaseMyOffice KYC Verification Portal
        </h1>
        <p className="mt-3 text-slate-600">
          This portal is used to complete your client verification after a
          booking. Please open the secure link sent to you on Email / WhatsApp.
        </p>
        <p className="mt-6 text-sm text-slate-400">
          Your link looks like{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">
            kyc.easemyoffice.in/verify/&hellip;
          </code>
        </p>
      </div>
    </main>
  );
}
