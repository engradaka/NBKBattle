// app/layout.tsx
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { LanguageProvider } from "@/lib/language-context";

export const metadata = { title: "Quizit", description: "Quiz app" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex">
        {/* Wrap client components in a separate client component */}
        <ClientWrapper>
          <aside className="w-20 h-screen sticky top-0 flex-shrink-0">
            <Sidebar />
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </ClientWrapper>
      </body>
    </html>
  );
}

// Create a separate client component wrapper
function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )
}