"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Upload, 
  ListFilter, 
  AlertTriangle, 
  Home,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Devices', href: '/devices', icon: Package },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Anomalies', href: '/anomalies', icon: AlertTriangle },
  { name: 'Upload', href: '/upload', icon: Upload },
];

export function Navigation() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const sidebarWidthClass = isHovered ? "w-64" : "w-20";
  const sidebarBgClass = "bg-card";

  return (
    <nav 
      className={cn(
        "fixed left-0 top-0 h-full border-r transition-all duration-300 ease-in-out z-50",
        sidebarWidthClass,
        sidebarBgClass
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <div className={cn(
          "flex items-center px-4 py-2",
          isHovered ? "flex-row gap-2" : "justify-center"
        )}>
          <Package className="h-6 w-6 text-primary" />
          <span className={cn(
            "text-lg font-semibold text-foreground transition-opacity duration-300",
            isHovered ? "opacity-100 ml-2" : "opacity-0 ml-0 w-0"
          )}>SCM</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center py-2 rounded-lg transition-colors",
                  isHovered 
                    ? "flex-row gap-3 px-4 text-sm font-medium"
                    : "flex-col justify-center w-full text-xs",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
                title={isHovered ? '' : item.name}
              >
                <item.icon className={cn(
                  "h-6 w-6 shrink-0",
                  isActive ? "text-primary-foreground" : "text-primary"
                )} />
                <span className={cn(
                  "transition-opacity duration-300",
                  isHovered ? "opacity-100 ml-2" : "opacity-0 h-0",
                  !isHovered && "mt-1"
                )}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 