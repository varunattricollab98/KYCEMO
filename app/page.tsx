import { Button } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          EaseMyOffice KYC Verification
        </h1>
        <p className="mt-3 text-slate-600">
          Complete your client verification in 3 quick steps — enter your
          details, upload your Aadhaar &amp; PAN, and record a short video.
        </p>
        <div className="mt-6">
          <Button href="/kyc">Start your KYC →</Button>
        </div>
      </div>
    </main>
  );
}
