# Project Context: BewerbRadar Copilot (ehemals JadeAI)

> **WICHTIGER HINWEIS FÜR KI-AGENTEN:** Lese diese Datei immer zuerst, um den architektonischen und historischen Kontext des Projekts zu verstehen!

## 1. Systemarchitektur & Deployment (Docker & Reverse Proxy)
Dieses Repository (`C:\Games\Dev\JadeAI` lokal) ist **nicht** das Hauptprojekt.
- **Hauptprojekt (Reactive Resume):** Liegt lokal unter `C:\Games\Dev\BewerbRadar`. Es ist ein Turborepo und läuft produktiv unter `bewerbradar.de`.
- **Dieses Projekt (Copilot):** Basiert ursprünglich auf dem Open-Source-Projekt "JadeAI" (Next.js App Router). Es wurde vollständig zu **"BewerbRadar Copilot"** umgebrandet.
- **VPS Deployment-Infrastruktur:**
  - Der Copilot läuft unter der Subdomain `https://copilot.bewerbradar.de`.
  - Das System läuft auf einem Linux VPS (über Hostinger) in einem **Docker Container**.
  - Der Node.js/Next.js Prozess läuft intern auf Port `3000`.
  - Ein Reverse Proxy (Nginx/Traefik) nimmt externe Anfragen an `copilot.bewerbradar.de` entgegen und routet sie intern auf Port `3000` weiter.
  - *Wichtig:* Environment Variablen (`.env`) müssen daher **direkt auf dem VPS** für den Docker-Container gesetzt werden (z.B. in der `.env`-Datei des Docker Setups), nicht über irgendein Web-Dashboard von Hostinger.

## 2. GitHub Branching-Strategie
- Der Quellcode für den Copilot liegt im Repository `Liutasil501/bewerbradar`. 
- Um den Code nicht mit dem Hauptprojekt zu vermischen, liegt der Copilot exklusiv auf dem Branch **`beta`**. 
- Pushes in den `beta`-Branch triggern sofort einen Auto-Deploy auf den Docker-Container des VPS.

## 3. Drizzle Studio & Datenbank
- **Drizzle Studio:** Die Datenbank (SQLite) kann visuell über Drizzle Studio verwaltet werden (`pnpm db:studio`). Der Befehl startet das Studio lokal auf Port `4983`. Es wurde eingerichtet, dass das Studio über eine eigene Subdomain (`studio.bewerbradar.de`) via Reverse Proxy ansprechbar ist, um die Datenbank live zu managen.
- **Datenbank-Felder (Stripe):** Wir haben das Schema in `src/lib/db/schema.ts` um folgende Stripe-spezifische Felder in der `users`-Tabelle erweitert:
  - `stripeCustomerId`
  - `stripeSubscriptionId`
  - `stripePriceId`
  - `stripeCurrentPeriodEnd`
  - `subscriptionStatus`
  - `subscriptionPlan` (Enum: `'free', 'pro', 'premium'`)

## 4. Stripe Paywall Integration & Lokalisierungen
- **Die Business Logik:** Wir nutzen die Hook `use-paywall.tsx`. Gratis-Nutzer können den Editor nutzen, stoßen aber bei Premium-Aktionen auf die `PricingModal`-Komponente.
- **Eingebaute Paywall-Buttons:** Die Paywall triggert explizit in folgenden UI-Dateien:
  - `export-dialog.tsx` (PDF-Download)
  - `cover-letter-dialog.tsx` (KI-Anschreiben)
  - `interview-lobby.tsx` (Mock-Interviews)
  - `grammar-check-dialog.tsx` (Grammatik-Korrektur)
  - `jd-analysis-dialog.tsx` (Job-Analyse)
  - `translate-dialog.tsx` (Übersetzer)
- **Hardcodierte Preise im Frontend:** Um Ladezeiten und API-Limits zu sparen, wurden die Pläne in allen Sprachen (`messages/de.json`, `en.json`, `zh.json`) hardcodiert. Dort haben wir Schlüssel wie `titlePro`, `titlePremium`, `descPro` hinzugefügt, sodass das UI blitzschnell auf Deutsch, Englisch oder Chinesisch reagiert.

## 5. Templates & Dummy-Daten
- **Vorbelegte Templates:** In `src/lib/db/sample-resume.ts` und `seed.ts` wurden Dummy-Daten hinterlegt. Wenn ein User ein neues Template auswählt, startet er nicht mit einem weißen Blatt, sondern sieht direkt strukturierte Beispiel-Inhalte (wie Max Mustermann, fiktive Jobs etc.), die das BewerbRadar Copilot Layout perfekt in Szene setzen.

## 6. QA & Bugfixes (Mai 2026)
Bei der Qualitätssicherung wurden zahlreiche Altlasten behoben:
1. **Mock Interview Lokalisierung (Chinesische Altlasten):** Das alte System hatte harte chinesische Prompts und Namen ("Li Wen") im Code. Wir haben `src/lib/interview/interviewers.ts` und `constants.ts` komplett übersetzt und 6 deutsche/englische HR-Personas geschaffen.
2. **KI-Locale-Erkennung:** In den API-Routen für das Cover-Letter (`src/app/api/ai/cover-letter/route.ts`) und Grammatik-Check wurde der `x-next-intl-locale` Header implementiert, damit die KI nicht versehentlich deutsche Texte ins Englische oder Chinesische umschreibt.
3. **Radix UI Dialog Fixes:** Es gab React-Verschachtelungsfehler, weil das `PricingModal` fälschlicherweise *innerhalb* von `<DialogContent>` diverser Modale gerendert wurde. Dies wurde gefixt, indem das Modal per React Fragment `<>` neben den Hauptdialog verschoben wurde.
4. **CSS UTF-16 Fehler:** Powershell-Pipes hatten die `globals.css` korrumpiert (invalid characters). Dies wurde durch ein Node-Skript bereinigt.

## 7. Offene To-Do's für den Live-Betrieb
1. **VPS Docker `.env`:** Auf dem VPS müssen im Docker-Setup die Live-Stripe-Keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) sowie `NEXT_PUBLIC_APP_URL` (`https://copilot.bewerbradar.de`) hinterlegt werden.
2. **Stripe Dashboard:** Im Stripe-Dashboard muss die Webhook-URL `https://copilot.bewerbradar.de/api/stripe/webhook` für Live-Events eingetragen werden.
3. **Logo austauschen:** Die Datei `public/logo.svg` muss manuell durch das echte BewerbRadar-Logo ersetzt werden.
