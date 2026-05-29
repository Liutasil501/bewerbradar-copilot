# Project Context: BewerbRadar Copilot (ehemals JadeAI)

> **WICHTIGER HINWEIS FÜR KI-AGENTEN:** Lese diese Datei immer zuerst, um den architektonischen und historischen Kontext des Projekts zu verstehen! Nimm niemals Kontext weg, sondern ergänze ihn nur.

## 1. Systemarchitektur, Ports & Interne Zugänge
Dieses Repository (`C:\Games\Dev\JadeAI` lokal) ist der **BewerbRadar Copilot**. Er existiert parallel zum Hauptprojekt auf dem gleichen Server.
Auf dem VPS laufen drei wesentliche Projekte/Dienste via Docker (`docker-compose`), die wir intern wie folgt gemappt haben:

1. **BewerbRadar (Hauptprojekt):** 
   - Das Reactive Resume Turborepo (`C:\Games\Dev\BewerbRadar`).
   - Läuft intern auf **Port 3000**.
   - Wird über den Reverse Proxy auf die Haupt-Domain geroutet.
2. **BewerbRadar Copilot (Dieses Projekt hier):**
   - Basiert auf "JadeAI".
   - Läuft intern auf **Port 3001** (Container Port 3000 wird auf Host Port 3001 gemappt).
   - Wird über den Reverse Proxy auf `https://copilot.bewerbradar.de` gemappt.
3. **Drizzle Studio (Datenbank-GUI):**
   - Läuft intern typischerweise auf **Port 4983** (`pnpm db:studio`).
   - Geplant als Zugang über eine eigene Subdomain (`studio.bewerbradar.de`), um die Nutzer und Tiers visuell zu managen.
   - *(Zusatz-Ports auf dem VPS: Postgres DB auf 5432, SeaweedFS Storage auf 8333).*

## 2. GitHub Branching & Deployment-Logik (Hostinger vs. Actions)
- **Deployment-Weg:** Wie wurde das aufgesetzt? Die App wird **direkt auf dem VPS via Hostinger Auto-Deploy** gezogen. Zwar gibt es im Repo unter `.github/workflows/publish.yml` eine Action, diese baut aber nur Images für den Docker Hub. Unser echter VPS-Flow ist: *Code geht auf GitHub -> Hostinger VPS zieht ihn sich automatisch (Git-Sync) und startet via `docker-compose up`.*
- **Warum Stripe-Keys nicht in GitHub dürfen:** Die Datei `.env` (die unsere Stripe Secret Keys enthält) steht aus Sicherheitsgründen in der `.gitignore`. Sie wird *niemals* auf GitHub hochgeladen. Da Hostinger den Code von GitHub zieht, fehlt die `.env` dort logischerweise. **Deshalb müssen die Stripe Keys manuell in die `.env` Datei direkt auf dem VPS (via SSH/Terminal) eingetragen werden.**
- **GitHub Repositories:** Das Hauptprojekt lebt in `Liutasil501/bewerbradar` (auf Branch `beta` für Auto-Deploy). Der Copilot-Code hier aus JadeAI muss über das Repo `Liutasil501/bewerbradar-copilot` mit dem VPS verknüpft werden.

## 3. Datenbank-Felder (Stripe Integration)
Wir haben das Schema in `src/lib/db/schema.ts` um folgende Stripe-spezifische Felder in der `users`-Tabelle erweitert, die über Stripe Webhooks (`checkout.session.completed`, `customer.subscription.updated/deleted`) auf `/api/stripe/webhook` befüllt werden:
- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`
- `stripeCurrentPeriodEnd`
- `subscriptionStatus`
- `subscriptionPlan` (Enum: `'free', 'pro', 'premium'`)

## 4. Stripe Paywall & Lokalisierungen (Exakte UI-Integration)
- **Die Business Logik:** Wir nutzen die Hook `use-paywall.tsx`. Gratis-Nutzer können den Editor nutzen, stoßen aber bei Premium-Aktionen auf die `PricingModal`-Komponente.
- **Eingebaute Paywall-Buttons (Locations):** Die Paywall triggert explizit und blockiert den Zugriff in folgenden UI-Dateien:
  - `export-dialog.tsx` (Blockiert PDF/DOCX Download)
  - `cover-letter-dialog.tsx` (Blockiert KI-Anschreiben)
  - `interview-lobby.tsx` (Blockiert den Zugang zum Mock-Interview)
  - `grammar-check-dialog.tsx` (Blockiert Grammatik-Korrektur)
  - `jd-analysis-dialog.tsx` (Blockiert Job-Analyse)
  - `translate-dialog.tsx` (Blockiert den CV-Übersetzer)
- **Hardcodierte Preise im Frontend:** Um Ladezeiten und Stripe-API-Limits zu sparen, wurden die Pläne in allen Sprachen (`messages/de.json`, `en.json`, `zh.json`) hardcodiert. Dort haben wir Schlüssel wie `titlePro`, `titlePremium`, `descPro` und Preise hinzugefügt, sodass das UI blitzschnell auf Deutsch, Englisch oder Chinesisch reagiert.

## 5. Templates & Dummy-Daten
- **Vorbelegte Templates:** In `src/lib/db/sample-resume.ts` und `seed.ts` wurden Dummy-Daten hinterlegt. Wenn ein User ein neues Template auswählt, startet er nicht mit einem weißen Blatt, sondern sieht direkt strukturierte Beispiel-Inhalte (wie Max Mustermann, fiktive Jobs etc.), die das BewerbRadar Copilot Layout perfekt in Szene setzen.

## 6. QA & Bugfixes (Mai 2026)
Bei der Qualitätssicherung wurden zahlreiche Bugfixes umgesetzt:
1. **Mock Interview Lokalisierung (Chinesische Altlasten):** Das alte System hatte harte chinesische Prompts und Namen ("Li Wen") im Code. Wir haben `src/lib/interview/interviewers.ts` und `constants.ts` komplett übersetzt und deutsche/englische HR-Personas geschaffen.
2. **KI-Locale-Erkennung:** In den API-Routen für das Cover-Letter (`src/app/api/ai/cover-letter/route.ts`) und Grammatik-Check wurde der `x-next-intl-locale` Header implementiert, damit die KI nicht versehentlich deutsche Texte ins Englische oder Chinesische umschreibt.
3. **Radix UI Dialog Fixes:** Es gab React-Verschachtelungsfehler, weil das `PricingModal` fälschlicherweise *innerhalb* von `<DialogContent>` diverser Modale gerendert wurde. Dies wurde gefixt, indem das Modal per React Fragment `<>` neben den Hauptdialog verschoben wurde.
4. **CSS UTF-16 Fehler:** Powershell-Pipes hatten die `globals.css` korrumpiert (invalid characters). Dies wurde durch ein Node-Skript bereinigt.

## 7. Offene To-Do's für den Live-Betrieb
1. **VPS Docker `.env`:** Auf dem VPS (im Verzeichnis des Copilot Docker-Containers) müssen in der `.env` die Live-Stripe-Keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) sowie `NEXT_PUBLIC_APP_URL` (`https://copilot.bewerbradar.de`) manuell hinterlegt werden.
2. **Stripe Dashboard:** Im Stripe-Dashboard muss die Webhook-URL `https://copilot.bewerbradar.de/api/stripe/webhook` für Live-Events eingetragen werden.
3. **Logo austauschen:** Die Datei `public/logo.svg` muss manuell durch das echte BewerbRadar-Logo ersetzt werden.


## 8. Server-Zugänge & Keys (Internes Access Management)
Die internen Zugänge und Keys zum VPS und den Hostinger-APIs liegen sicher im lokalen Verzeichnis:
`C:\Games\Dev\VPS2 NEWST 2028`
- `HOSTINGER API 26-05.txt` (Hostinger API Zugänge)
- `GITHUB_05_2026_OpenClaw.txt` (GitHub Tokens)
- `id_ed25519` / `id_ed25519.pub` (SSH Keys für den direkten VPS Zugang)
Diese Dateien werden niemals ins Repo gepusht, sondern dienen uns als lokaler Anker für manuelle SSH-Verbindungen oder API-Verwaltungen.

---

## Changelog / Logbuch

### 29. Mai 2026
- **VPS/Docker Klärung:** Es wurde final dokumentiert, dass der Copilot intern auf Port `3001` (Container Port 3000) gemappt ist und über den Reverse Proxy auf `copilot.bewerbradar.de` läuft. Hauptprojekt (Reactive Resume) läuft auf Port `3000`.
- **GitHub Repos getrennt:** Um Überschneidungen zu verhindern, wurde `Liutasil501/bewerbradar-copilot` als separates Repo für den Copilot etabliert, statt den Code in den `beta`-Branch des Hauptprojekts zu drücken.
- **Drizzle Studio:** Subdomain `studio.bewerbradar.de` via Port `4983` als internes GUI ergänzt.
- **Stripe & Paywall:** Exakte Integration in den Dialog-Komponenten (`export-dialog.tsx` etc.) und in der SQLite Datenbank dokumentiert.
- **Bugfixes:** Lokalisierungsfehler (Chinesische Personas), `x-next-intl-locale` Header, Dialog-Verschachtelungs-Bugs (Radix UI) und CSS-Encoding-Fehler erfolgreich bereinigt.
- **Interne Zugänge hinterlegt:** Ablageort der VPS/Hostinger Keys (`C:\Games\Dev\VPS2 NEWST 2028`) ins Log aufgenommen.


### 26. Mai 2026 (Architektur-Kickoff & VPS Setup)
- **Deployment Strategie:** Entscheidung gegen GitHub Actions für das Deployment. Stattdessen zieht sich der Hostinger VPS den Code direkt vom `beta`-Branch.
- **SSH & Env-Setup:** Da die `.env`-Datei (mit den sensiblen Stripe Keys) nicht auf GitHub darf, wurde sie manuell per SSH-Zugriff (`147.93.121.183`) auf dem VPS im Docker-Verzeichnis angelegt.
- **MCP & IDE:** Ersteinrichtung der MCP-Server in der lokalen IDE, Vergabe von Berechtigungen für das GitHub-Repository.

### 27. Mai 2026 (Hauptprojekt & Fehleranalyse)
- **Minimalinvasive Umbauten ("Option B"):** Diskussion über schonende Eingriffe in das Hauptprojekt (Reactive Resume), um zukünftige Updates nicht zu blockieren.
- **Lokalisierung (Templates):** Fokus auf Deutsch als Standard-Sprache für alle CV-Templates gesetzt.
- **Dashboard Bugfixes:** Bereinigung diverser UI-Bugs in der `sidebar.tsx` und im Billing-Bereich.

---

## 9. Nginx-Routing Klärung (Port 3000 vs 4983)
Du hast die `bewerbradar.conf` völlig richtig analysiert! Hier ist die Auflösung, warum `studio` auf Port 3000 gemappt ist:
- **`bewerbradar.de` (Hauptdomain):** Liefert nur das reine, statische Frontend (Landingpage) aus `/var/www/bewerbradar-landing`. Es nutzt keinen Node-Port.
- **`studio.bewerbradar.de`:** Das ist in eurer Konfiguration das **tatsächliche Hauptprojekt (Reactive Resume)**! Deshalb leitet Nginx hier auf **Port 3000** weiter (den Node-Server des Hauptprojekts).
- **Port 4983:** Das ist ausschließlich Drizzle Studio (die reine Datenbank-GUI). Diese wurde ursprünglich für `studio` angedacht, aber das Nginx-Routing beweist, dass unter "Studio" bei euch die Haupt-Applikation läuft!
- **`copilot.bewerbradar.de`:** Ist korrekt auf **Port 3001** geroutet (unser JadeAI Projekt).
