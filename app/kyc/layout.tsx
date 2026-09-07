export default function KycLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-4 sm:p-8">
      {children}
    </div>
  );
}
