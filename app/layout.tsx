import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell } from "lucide-react";

const inter = Inter({
  variable: "--font-inter",
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

  // If not logged in, render children without sidebar (login page)
  if (!session) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <SidebarProvider>
            <AppSidebar user={session.user} />
            <SidebarInset>
              <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-muted transition-colors" />
                  <div className="hidden md:flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-muted-foreground">All systems operational</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink-500" />
                  </button>
                  <div className="h-6 w-px bg-border" />
                  <ThemeToggle />
                </div>
              </header>
              <div className="flex flex-1 flex-col">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
