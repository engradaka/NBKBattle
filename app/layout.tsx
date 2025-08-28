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
      <body>
        <ClientWrapper>
          {children}
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