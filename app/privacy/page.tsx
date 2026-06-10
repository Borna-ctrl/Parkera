import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integritetspolicy – Parkera",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Integritetspolicy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Senast uppdaterad: 2026-06-09
      </p>

      <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="mb-1 font-semibold">Personuppgiftsansvarig</h2>
          <p>
            Parkera ansvarar för behandlingen av dina personuppgifter i enlighet
            med GDPR.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Vilka uppgifter vi behandlar</h2>
          <p>
            Vi behandlar din e-postadress, ditt namn samt innehållet i dina
            annonser, bokningar och meddelanden. Uppgifterna används för att
            tillhandahålla tjänsten – skapa konto, visa annonser och möjliggöra
            kontakt mellan användare.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Var uppgifterna lagras</h2>
          <p>
            Uppgifterna lagras inom EU (Supabase, Frankfurt) och hostas via
            leverantörer med servrar inom EU. Vi säljer aldrig dina uppgifter.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Dina rättigheter</h2>
          <p>
            Du har rätt att få tillgång till, rätta eller radera dina
            personuppgifter. Kontakta oss så hjälper vi dig. Du kan också radera
            ditt konto, varvid dina uppgifter tas bort.
          </p>
        </section>

        <p className="text-muted-foreground">
          Kontakt i integritetsfrågor:{" "}
          <a href="mailto:hej@parkera.se" className="text-primary hover:underline">
            hej@parkera.se
          </a>
          .
        </p>
      </div>
    </div>
  );
}
