"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { LISTING_IMAGES_BUCKET, publicImageUrl } from "@/lib/listings/images";

const MAX_IMAGES = 8;

export function ImageUploader({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: string[];
  onChange: (paths: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    if (value.length + files.length > MAX_IMAGES) {
      setError(`Du kan ladda upp max ${MAX_IMAGES} bilder.`);
      return;
    }

    setError(null);
    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(LISTING_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setError("Kunde inte ladda upp en av bilderna.");
        continue;
      }
      uploaded.push(path);
    }

    onChange([...value, ...uploaded]);
    setUploading(false);
  }

  function remove(path: string) {
    onChange(value.filter((p) => p !== path));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((path) => (
          <div
            key={path}
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
          >
            <Image
              src={publicImageUrl(path)}
              alt="Annonsbild"
              fill
              className="object-cover"
              sizes="120px"
            />
            <button
              type="button"
              onClick={() => remove(path)}
              className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Ta bort bild"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/50 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            <span>{uploading ? "Laddar…" : "Lägg till"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
