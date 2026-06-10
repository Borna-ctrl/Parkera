import Image from "next/image";

import { avatarPublicUrl } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  path,
  size = 40,
  className,
}: {
  name?: string | null;
  path?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  if (path) {
    return (
      <Image
        src={avatarPublicUrl(path)}
        alt={name?.trim() || "Profilbild"}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
