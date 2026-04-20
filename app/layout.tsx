import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rally Dashboard",
  description: "Internal dashboard for Rally team - CI/CD monitoring, Jira feeds, and quick links",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
            <Providers>
                {session?.user ? (
                    <AuthenticatedLayout user={session.user}>
                        {children}
                    </AuthenticatedLayout>
                ) : (
                    children
                )}
            </Providers>
        </body>
    </html>
  );
}
