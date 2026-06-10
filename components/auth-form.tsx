"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Fel e-post eller lösenord.";
  if (m.includes("email not confirmed"))
    return "Bekräfta din e-postadress innan du loggar in.";
  if (m.includes("user already registered"))
    return "Det finns redan ett konto med den e-postadressen.";
  if (m.includes("password should be at least"))
    return "Lösenordet måste vara minst 6 tecken.";
  return "Något gick fel. Försök igen.";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    if (mode === "signup") {
      const fullName = String(formData.get("full_name") ?? "");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(translateAuthError(error.message));
        setLoading(false);
        return;
      }

      setMessage(
        "Vi har skickat ett bekräftelsemail. Klicka på länken för att aktivera ditt konto."
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(translateAuthError(error.message));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === "signup" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name">Namn</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            placeholder="Förnamn Efternamn"
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="du@exempel.se"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Lösenord</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          placeholder="Minst 6 tecken"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-primary">{message}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? "Vänta…"
          : mode === "signup"
            ? "Skapa konto"
            : "Logga in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Har du redan ett konto?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Logga in
            </Link>
          </>
        ) : (
          <>
            Inget konto?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Skapa ett
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
