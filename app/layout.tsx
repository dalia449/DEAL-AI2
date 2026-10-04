export const metadata = { title: "DEAL" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: "#d4cdc4", fontFamily: "system-ui, sans-serif", color: "#4a3f35" }}>{children}</body>
    </html>
  );
}
