'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  HomeIcon, 
  SearchIcon, 
  BarChartIcon, 
  UserIcon,
  CameraIcon
} from 'lucide-react';

const CompareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4"></path>
    <path d="M18 9h-3"></path>
    <path d="M18 13h-3"></path>
    <path d="M18 17h-3"></path>
    <path d="M14 3v18"></path>
    <path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
  </svg>
);

export default function Navigation() {
  const pathname = usePathname();
  
  const menuItems = [
    { href: '/', label: 'Home', icon: <HomeIcon className="h-5 w-5" /> },
    {
      href: '/ai-coach/densepose',
      label: 'DensePose Analysis',
      icon: <CameraIcon className="h-5 w-5" />
    },
    {
      href: '/ai-coach/pose-comparison',
      label: 'Pose Comparison',
      icon: <CompareIcon className="h-5 w-5" />
    },
    {
      href: '/progress',
      label: 'Progress',
      icon: <BarChartIcon className="h-5 w-5" />
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: <UserIcon className="h-5 w-5" />
    }
  ];

  return (
    <nav className="flex sm:flex-col items-center sm:items-start sm:w-[240px] p-2 sm:p-4 bg-background sm:border-r">
      <div className="flex sm:flex-col w-full items-center sm:items-start gap-2">
        <div className="hidden sm:block p-2">
          <h1 className="text-xl font-bold">Posing Coach</h1>
        </div>
        
        <div className="w-full flex sm:flex-col space-x-1 sm:space-x-0 sm:space-y-1 mt-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-full"
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  {item.icon}
                  <span className="hidden sm:inline ml-2">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 