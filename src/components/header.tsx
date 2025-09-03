"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { DynamicLogo } from "@/components/dynamic-logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/conversions", label: "Conversions" },
    { href: "/payment-methods", label: "Payment Methods" },
    { href: "/transactions", label: "History" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b px-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <DynamicLogo />
          </Link>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 relative",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-4 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search can be added here later */}
          </div>
          <nav className="flex items-center space-x-3">
            <ModeToggle />
            <DynamicWidget />
          </nav>
        </div>
      </div>
    </header>
  );
}
