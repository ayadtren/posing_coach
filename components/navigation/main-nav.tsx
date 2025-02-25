"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, Settings, Dumbbell, Command } from "lucide-react";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5 mr-2" />
    },
    {
      href: "/progress",
      label: "Progress",
      active: pathname === "/progress",
      icon: <LineChart className="h-5 w-5 mr-2" />
    },
    {
      href: "/ai-coach",
      label: "AI Coach",
      active: pathname === "/ai-coach" || pathname.startsWith("/ai-coach/"),
      icon: <Dumbbell className="h-5 w-5 mr-2" />
    },
    {
      href: "/settings",
      label: "Settings",
      active: pathname === "/settings",
      icon: <Settings className="h-5 w-5 mr-2" />
    }
  ];

  return (
    <div className="flex items-center">
      <Link href="/" className="mr-6 flex items-center">
        <Command className="h-6 w-6 mr-2" />
        <span className="font-bold">PosePrep Pro</span>
      </Link>
      <nav className="flex items-center space-x-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              route.active 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            {route.icon}
            {route.label}
          </Link>
        ))}
      </nav>
    </div>
  );
} 