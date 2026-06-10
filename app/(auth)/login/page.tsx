import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Logga in</CardTitle>
          <CardDescription>Välkommen tillbaka till Parkera.</CardDescription>
        </CardHeader>
        <CardContent>
          {error === "auth" && (
            <p className="mb-4 text-sm text-destructive">
              Länken kunde inte verifieras. Begär en ny eller försök logga in.
            </p>
          )}
          <AuthForm mode="login" />
        </CardContent>
      </Card>
    </div>
  );
}
