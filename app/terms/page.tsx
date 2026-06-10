import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Användarvillkor – Parkera",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Användarvillkor</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Senast uppdaterad: 2026-06-09
      </p>

      <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="mb-1 font-semibold">1. Om tjänsten</h2>
          <p>
            Parkera är en marknadsplats som förmedlar kontakt mellan privatpersoner
            som vill hyra ut respektive hyra parkeringsplatser i Göteborg. Parkera
            är inte part i avtalet mellan uthyrare och hyresgäst.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">2. Konto</h2>
          <p>
            Du ansvarar för att uppgifterna du anger är korrekta och för all
            aktivitet som sker via ditt konto. Du måste vara minst 18 år för att
            använda tjänsten.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">3. Annonser och bokningar</h2>
          <p>
            Uthyraren ansvarar för att annonsen är korrekt och att platsen får
            hyras ut. En bokningsförfrågan är inte bindande förrän uthyraren har
            accepterat den. Parkera hanterar inte betalning i denna version –
            betalning och eventuell överenskommelse sker direkt mellan parterna.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">4. Ansvarsbegränsning</h2>
          <p>
            Parkera tillhandahåller endast plattformen och ansvarar inte för skador,
            förluster eller tvister som uppstår mellan användare. Tjänsten
            tillhandahålls i befintligt skick.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">5. Uppförande</h2>
          <p>
            Det är inte tillåtet att använda tjänsten för olagliga ändamål, att
            publicera vilseledande annonser eller att trakassera andra användare.
            Vi kan stänga av konton som bryter mot villkoren.
          </p>
        </section>

        <p className="text-muted-foreground">
          Frågor om villkoren? Kontakta oss på{" "}
          <a href="mailto:hej@parkera.se" className="text-primary hover:underline">
            hej@parkera.se
          </a>
          .
        </p>
      </div>
    </div>
  );
}
