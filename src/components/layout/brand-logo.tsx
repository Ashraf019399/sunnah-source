import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  className?: string;
  priority?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  priority = false,
}) => {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center shrink-0 group", className)}
      aria-label="Sunnah Source"
    >
      <Image
        src="/images/logo.svg"
        alt="Sunnah Source"
        width={160}
        height={40}
        priority={priority}
        className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
      />
    </Link>
  );
};
