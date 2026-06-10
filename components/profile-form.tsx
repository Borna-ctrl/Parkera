"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { updateProfile, type ProfileState } from "@/lib/profile/actions";
import { createClient } from "@/lib/supabase/client";
import { AVATARS_BUCKET } from "@/lib/avatars";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  userId,
  initialName,
  initialAvatar,
}: {
  userId: string;
  initialName: string;
  initialAvatar: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {}
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarPath, setAvatarPath] = useState(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    setUploading(false);
    if (error) {
      setUploadError("Kunde inte ladda upp bilden.");
      return;
    }
    setAvatarPath(path);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Profilbild</Label>
        <div className="flex items-center gap-4">
          <Avatar name={initialName} path={avatarPath || null} size={64} />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {avatarPath ? "Byt bild" : "Ladda upp"}
              </Button>
              {avatarPath && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvatarPath("")}
                  disabled={uploading}
                >
                  Ta bort
                </Button>
              )}
            </div>
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <input type="hidden" name="avatar_url" value={avatarPath} readOnly />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Namn</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          defaultValue={initialName}
          placeholder="Förnamn Efternamn"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-primary">Profilen är sparad.</p>
      )}

      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Sparar…" : "Spara"}
      </Button>
    </form>
  );
}
