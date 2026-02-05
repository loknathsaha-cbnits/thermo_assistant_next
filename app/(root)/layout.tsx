"use client";

import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { ProfileDropdown } from "@/components/profile-dropdown";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function SidebarToggle() {
  const { open } = useSidebar();
  if (open) return null;
  return <SidebarTrigger />;
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen transition ease-in-out overflow-x-hidden">
        <AppSidebar />
        <main className="grow">
          <div className="border-b px-2 md:px-6 py-2 sticky top-0 right-0  h-14 flex items-center justify-between ">
            <span className="flex items-center md:gap-4">
              <span className="hidden md:block">
                <SidebarToggle />
              </span>
              <SidebarTrigger className="md:hidden" />
                <span className="hidden md:block text-xl font-bold">
                  ThermoFisher
                </span>
            </span>
            <ProfileDropdown />
          </div>
          <Toaster richColors closeButton position="top-center" />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
