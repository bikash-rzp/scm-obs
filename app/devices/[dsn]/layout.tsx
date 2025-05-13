export default function DeviceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}

export async function generateStaticParams() {
  // For static export, provide a list of DSNs that should be pre-rendered
  return [
    { dsn: 'sample-dsn-1' },
    { dsn: 'sample-dsn-2' },
    // Add more DSNs as needed
  ];
}