"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DynamicLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <div className="h-8 w-32 bg-muted animate-pulse rounded" />;
  }

  // Use resolvedTheme to handle system theme
  const isDark = resolvedTheme === "dark";
  const logoSrc = isDark ? "/logo-light.png" : "/logo-dark.png";

  return (
    <Image
      className="h-8 w-auto object-contain"
      src={logoSrc}
      alt="Dynamic"
      width={120}
      height={32}
      priority
    />
  );
}
