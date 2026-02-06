"use client"

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Edit } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "New chat",
    url: "/chat",
    icon: Edit,
  }
];

type ConversationType = {
  id: string;
  title: string;
  firstMessage: string;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  });

export function AppSidebar() {
  const { data: conversations = [] } = useSWR<ConversationType[]>("/api/conversations", fetcher);
  const pathName = usePathname();

  return (
    <Sidebar>
      <SidebarContent className="p-1">
        <SidebarGroup>
          <div className="flex justify-between items-center mt-5 mb-10">
            <Link href={"/chat"} className="cursor-pointer py-1 rounded-md hover:bg-sidebar-accent">
              <SidebarGroupLabel><Image src="/thermo_logo.png" alt="Thermofisher_logo" className="rounded-md" width={160} height={25} /></SidebarGroupLabel>
            </Link>
            <SidebarTrigger />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathName === item.url && item.url !== "/chat";

                return (
                  <SidebarMenuItem key={item.title} className={`-mb-1 rounded-lg text-sm leading-3 font-sans hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent" : ""}`}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((c: ConversationType) => {    
                const isActive = pathName === `/chat/${c.id}`;
                return (
                  <SidebarMenuItem key={c.id} className={`-mb-1 rounded-lg text-sm leading-3 font-sans hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent" : ""}`}>
                    <Link href={`/chat/${c.id}`} className="truncate block py-3 px-2 ">
                      { c.title === "New chat" ? c.firstMessage : c.title }
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
