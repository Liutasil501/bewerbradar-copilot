# Project Context: BewerbRadar Copilot (ehemals JadeAI)

> **WICHTIGER HINWEIS FÜR KI-AGENTEN:** Lese diese Datei immer zuerst, um den architektonischen und historischen Kontext des Projekts zu verstehen!

## 1. Projekt-Architektur & Domains
Dieses Repository (`C:\Games\Dev\JadeAI` lokal) ist **nicht** das Hauptprojekt.
- **Hauptprojekt (Reactive Resume Fork):** Liegt lokal unter `C:\Games\Dev\BewerbRadar`. Es ist ein Turborepo und läuft produktiv unter `bewerbradar.de`.
- **Dieses Projekt (Copilot):** Basiert ursprünglich auf dem Open-Source-Projekt "JadeAI" (Next.js App Router). Es wurde vollständig zu **"BewerbRadar Copilot"** umgebrandet.
- **Deployment:** Der Copilot läuft unter der Subdomain `https://copilot.bewerbradar.de`. Er wird über einen Hostinger-VPS gehostet. Hostinger zieht sich den Code automatisch vom **`beta`**-Branch des GitHub-Repositories `Liutasil501/bewerbradar`.

## 2. GitHub Branching-Strategie
- Da das Haupt-Repo `Liutasil501/bewerbradar` für das Hauptprojekt gedacht war, nutzen wir für den Copilot strikt den Branch **`beta`**. 
- Pushes in den `beta`-Branch triggern sofort einen Auto-Deploy auf dem Hostinger-VPS für die Subdomain `copilot.bewerbradar.de`.
- (Es existiert noch ein verwaistes Repo `bewerbradar-copilot`, das ignoriert werden kann).

## 3. Historie der Anpassungen (Mai 2026)
### a) Rebranding
Alle Referenzen an "JadeAI" wurden im Code, in den Lokalisierungs-Dateien (`messages/*.json`), in den Prompts (`src/lib/ai/prompts.ts`) und in den Browser-Storage-Keys (z.B. `br_fingerprint`) entfernt. Das System identifiziert sich als "BewerbRadar Copilot".

### b) Stripe Paywall Integration
- **Ziel:** Monetarisierung der KI-Funktionen und PDF-Exporte über ein Freemium-Modell.
- **Logik:** Wir haben die Hook `use-paywall.tsx` eingeführt. Gratis-Nutzer können den Editor nutzen, stoßen aber bei Premium-Aktionen (KI-Generierung, Cover-Letter, PDF-Export) auf die `PricingModal`-Komponente.
- **Pläne:** Es gibt `Pro` (günstiger, ohne KI) und `Premium` (mit KI).
- **Webhooks:** Stripe-Webhooks (`checkout.session.completed`, `customer.subscription.updated/deleted`) laufen über `/api/stripe/webhook` und aktualisieren die User-Tiers in der Datenbank (`users.tier`).

### c) Bugfixes & QA
- **Radix UI Dialog Fixes:** Es gab schwere React-Verschachtelungsfehler, weil das `PricingModal` fälschlicherweise *innerhalb* von `<DialogContent>` diverser Modale (z.B. `cover-letter-dialog.tsx`, `export-dialog.tsx`) gerendert wurde. Dies wurde gefixt, indem das Modal per React Fragment `<>` neben den Hauptdialog verschoben wurde.
- **CSS UTF-16 Fehler:** Powershell-Pipes hatten die `globals.css` korrumpiert (invalid characters). Dies wurde durch ein Node-Skript (`fix-css.js`) bereinigt.
- **TypeScript:** Der Code wurde per `pnpm type-check` geprüft und ist komplett fehlerfrei kompiliert.

## 4. Offene To-Do's für Live-Betrieb
1. **Hostinger Env Vars:** Im Hostinger-Dashboard müssen für den Copilot die Live-Stripe-Keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) sowie `NEXT_PUBLIC_APP_URL` (`https://copilot.bewerbradar.de`) hinterlegt werden.
2. **Stripe Dashboard:** Im Stripe-Dashboard muss die Webhook-URL `https://copilot.bewerbradar.de/api/stripe/webhook` für Live-Events eingetragen werden.
3. **Logo austauschen:** Die Datei `public/logo.svg` muss noch manuell durch das BewerbRadar-Logo ersetzt werden.
