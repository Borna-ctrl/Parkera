"use client";

import { useState } from "react";
import Image from "next/image";
import { SquareParking } from "lucide-react";

import { cn } from "@/lib/utils";
import { publicImageUrl } from "@/lib/listings/images";

export function ImageGallery({ paths }: { paths: string[] }) {
  const [active, setActive] = useState(0);

  if (paths.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <SquareParking className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={publicImageUrl(paths[active])}
          alt="Annonsbild"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {paths.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {paths.map((path, i) => (
            <button
              key={path}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2",
                i === active ? "border-primary" : "border-transparent"
              )}
            >
              <Image
                src={publicImageUrl(path)}
                alt={`Miniatyr ${i + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
