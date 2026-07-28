# Project Context: BewerbRadar Copilot (ehemals JadeAI)

## Analytics-Stand (28. Juli 2026)
- Der Google-Tag-Manager-Webcontainer `GTM-55XL7PR4` ist im globalen Next.js Root-Layout eingebunden und gilt damit für alle Copilot-Routen.
- Die öffentliche Container-ID kann optional über `NEXT_PUBLIC_GTM_ID` überschrieben werden; ohne Variable wird `GTM-55XL7PR4` verwendet.
- Consent Mode v2 wird vor GTM mit `analytics_storage`, `ad_storage`, `ad_user_data` und `ad_personalization` auf `denied` initialisiert.
- Noch offen sind die CMP-/Cookie-Banner-Anbindung, das Google-Tag mit der GA4-Mess-ID, Funnel-Events und die Veröffentlichung der getesteten GTM-Container-Version.

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

## 2. GitHub Architektur & Branching-Strategie (Going Forward)
Um Konflikte zwischen der Landingpage/Haupt-App und dem Copilot zu vermeiden, fahren wir ab sofort folgende strikte Repository- und Branch-Strategie:

- **Zwei getrennte Repositories:** 
  1. `Liutasil501/bewerbradar`: Nur für die Haupt-App (Reactive Resume) & Landingpage.
  2. `Liutasil501/bewerbradar-copilot`: Exklusiv für diesen KI-Copilot (JadeAI-Basis).
- **Die Branch-Logik (Zero-Downtime Rule):**
  - **`main`:** Ist der **Live-Branch** (Production). Der Hostinger VPS lauscht *ausschließlich* auf den `main`-Branch und zieht sich via Auto-Deploy den Code. **Jeder Push auf `main` startet den Server neu!** Daher darf hier **niemals** direkt gearbeitet werden, um aktive User nicht rauszuwerfen.
  - **`beta`:** Dient als unser **lokaler Arbeits- und Test-Branch**. 100% der Entwicklung (auch kleine Fixes) finden hier statt.
  - **Controlled Deployments:** Erst wenn wir sicher sind, mergen wir von `beta` nach `main` – idealerweise zu Randzeiten, um den Server bewusst neu zu starten.
- **Semantic Versioning (Git Tags):** 
  Um stets den Überblick zu behalten, arbeiten wir mit Tags (z.B. `v1.0.0`). Jeder Push auf `main`, der ein neues Feature oder einen kritischen Bugfix enthält, bekommt einen sauberen Release-Tag. Damit können wir im Notfall sofort auf eine alte Version zurückrollen.
- **Warum Stripe-Keys nicht in GitHub dürfen:** Die Datei `.env` (die unsere Stripe Secret Keys enthält) steht aus Sicherheitsgründen in der `.gitignore`. Sie wird *niemals* auf GitHub hochgeladen. Da Hostinger den Code von GitHub zieht, fehlt die `.env` dort logischerweise. **Deshalb müssen die Stripe Keys manuell in die `.env` Datei direkt auf dem VPS eingetragen werden.**

## 3. Datenbank-Felder (Stripe Integration)
Wir haben das Schema in `src/lib/db/schema.ts` um folgende Stripe-spezifische Felder in der `users`-Tabelle erweitert, die über Stripe Webhooks (`checkout.session.completed`, `customer.subscription.updated/deleted`) auf `/api/stripe/webhook` befüllt werden:
- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`
- `stripeCurrentPeriodEnd`
- `subscriptionStatus`
- `subscriptionPlan` (Enum: `'free', 'pro', 'premium'`)

## 4. Stripe Paywall & Freemium-Modell (Warum & Wofür?)
**Wieso ein Freemium-Modell (Free, Pro, Premium)?**
KI-Tokens (LLM-Aufrufe) kosten Geld. Um Missbrauch zu verhindern und die Serverkosten zu decken, wurde eine harte Stripe-Paywall implementiert. 
- **Free:** Erlaubt Nutzern, die App kennenzulernen (Basis-Editor), schließt aber alle KI- und Export-Features aus.
- **Pro / Premium:** Schaltet tiefgreifende KI-Funktionen (wie das Mock-Interview) und Premium-Exporte (PDF/DOCX) frei. Das Modell stellt sicher, dass nur zahlende Kunden Rechenleistung verbrauchen.

**Exakte UI-Integration (Die Business Logik):**
- Wir nutzen den Hook `use-paywall.tsx`, um live zu prüfen, in welchem Tier der Nutzer is. Gratis-Nutzer stoßen bei Premium-Aktionen auf die `PricingModal`-Komponente.
- **Eingebaute Paywall-Buttons (Locations):** Die Paywall triggert explizit und blockiert den Zugriff in folgenden UI-Dateien:
  - `export-dialog.tsx` (Blockiert PDF/DOCX Download)
  - `cover-letter-dialog.tsx` (Blockiert KI-Anschreiben)
  - `interview-lobby.tsx` (Blockiert den Zugang zum Mock-Interview)
  - `grammar-check-dialog.tsx` (Blockiert Grammatik-Korrektur)
  - `jd-analysis-dialog.tsx` (Blockiert Job-Analyse)
  - `translate-dialog.tsx` (Blockiert den CV-Übersetzer)
- **Hardcodierte Preise im Frontend:** Um Ladezeiten und Stripe-API-Limits zu sparen, wurden die Pläne in allen Sprachen (`messages/de.json`, `en.json`, `zh.json`) hardcodiert. Dort haben wir Schlüssel wie `titlePro`, `titlePremium`, `descPro` und Preise hinzugefügt, sodass das UI blitzschnell auf Deutsch, Englisch oder Chinesisch reagiert.

## 5. Templates & Dummy-Daten
- **Vorbelegte Templates:** In `src/lib/db/sample-resume.ts` and `seed.ts` wurden Dummy-Daten hinterlegt. Wenn ein User ein neues Template auswählt, startet er nicht mit einem weißen Blatt, sondern sieht direkt strukturierte Beispiel-Inhalte (wie Max Mustermann, fiktive Jobs etc.), die das BewerbRadar Copilot Layout perfekt in Szene setzen.

## 6. QA & Bugfixes (Mai 2026)
Bei der Qualitätssicherung wurden zahlreiche Bugfixes umgesetzt:
1. **Mock Interview Lokalisierung (Chinesische Altlasten):** Das alte System hatte harte chinesische Prompts und Namen ("Li Wen") im Code. Wir haben `src/lib/interview/interviewers.ts` and `constants.ts` komplett übersetzt und deutsche/englische HR-Personas geschaffen.
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
- `known_hosts` (SSH Known Hosts zur Verifizierung der VPS Identität)
- `MS Portfolio Brand/` (Marken-Assets und Logos)

Diese Dateien werden niemals ins Repo gepusht, sondern dienen uns als lokaler Anker für manuelle SSH-Verbindungen oder API-Verwaltungen.

---

## Changelog / Logbuch

### 2. Juni 2026 (Stripe Self-Healing & Build-Korrekturen)
- **Stripe Double-Billing & Kundenportal Fixes:** 
  - Die Kundenportals-Route (`c:\Games\Dev\JadeAI\src\app\api\stripe\portal\route.ts`) und Checkout-Route (`c:\Games\Dev\JadeAI\src\app\api\stripe\checkout\route.ts`) wurden um eine robuste Self-Healing-Prüfung per Stripe API erweitert.
  - Wenn ein Nutzer versucht, sein Portal zu öffnen oder ein Checkout zu starten, prüft das Backend nun in Echtzeit bis zu 10 existierende Kundenkonten in Stripe für diese E-Mail auf aktive/trialing Subscriptions.
  - Findet es ein aktives Abo, repariert sich die lokale DB sofort selbst (Verknüpfung der korrekten Kunden-ID, Freischaltung des entsprechenden Plans und Synchronisation des Zeitraums), und leitet den Nutzer direkt in das korrekte Portal weiter. Dies repariert out-of-sync Accounts vollautomatisch.
- **Sicherheits-Bereinigung:** Die nicht-authentifizierte Debug-Route `/api/stripe/debug-customer` wurde gelöscht, um Kundendaten zu sichern.
- **ESLint & TS Kompilierungs-Fixes:** Alle Typfehler und Linter-Meldungen in den modifizierten Routen wurden durch typsichere Definitionen behoben (keine Verwendung von `any` mehr).

### 29. Mai 2026
- **VPS/Docker Klärung:** Es wurde final dokumentiert, dass der Copilot intern auf Port `3001` (Container Port 3000) gemappt ist und über den Reverse Proxy auf `copilot.bewerbradar.de` läuft. Hauptprojekt (Reactive Resume) läuft auf Port `3000`.
- **GitHub Repos getrennt:** Um Überschneidungen zu verhindern, wurde `Liutasil501/bewerbradar-copilot` as separates Repo für den Copilot etabliert, statt den Code in den `beta`-Branch des Hauptprojekts zu drücken.
- **Drizzle Studio:** Subdomain `studio.bewerbradar.de` via Port `4983` als internes GUI ergänzt.
- **Stripe & Paywall:** Exakte Integration in den Dialog-Komponenten (`export-dialog.tsx` etc.) und in der SQLite Datenbank dokumentiert.
- **Bugfixes:** Lokalisierungsfehler (Chinesische Personas), `x-next-intl-locale` Header, Dialog-Verschachtelungs-Bugs (Radix UI) and CSS-Encoding-Fehler erfolgreich bereinigt.
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

### 28. Juli 2026 (Unbegrenzte KI-Importe für Free-User, Auto-Provider Detection, SQLite Migrations & Drizzle 0010)
- **Freischaltung KI-Importe für Free-User:** Auf Nutzer-Feedback hin wurde die künstliche 1-Import-Sperre für Free-User aufgehoben. Free-User können ihre Lebensläufe ab sofort beliebig oft per KI importieren, solange sie das 1-Lebenslauf-Limit im Free-Tarif einhalten.
- **DB-Usage-Tracking (`ai_imports_count`):** Das Datenbank-Feld `ai_imports_count` in der `users`-Tabelle bleibt erhalten und zählt weiterhin jeden KI-Import in SQLite hoch (`+1`). Damit lässt sich die Nutzung in `studio.bewerbradar.de` visuell auswerten.
- **Offizielle Drizzle Migration 0010:** Drizzle-Kit Migration `0010_clever_senator_kelly.sql` generiert und unter `drizzle/migrations/` eingecheckt. `SQLiteAdapter` um automatische Spalten-Migration erweitert, sodass Alt-Datenbanken ohne Datenverlust aktualisiert werden.
- **Auto-Provider-Erkennung (`provider.ts`):** Das System erkennt den KI-Anbieter ab sofort automatisch anhand des API-Key-Präfix (`AIzaSy...` -> Gemini, `sk-ant-` -> Anthropic), selbst wenn im Client-Dropdown versehentlich ein abweichender Provider eingestellt war.
- **Paywall Upgrade Card Fix:** Sämtliche API-Key-Fehler (inkl. Google HTTP 400 `API_KEY_INVALID`) fangen nun sauber ab und blenden im Import-Dialog zuverlässig die Pro & Premium Upgrade Card (`👑 Auf Pro / Premium upgraden`) ein, anstatt eine 500er Fehlermeldung auszugeben.
- **KI-Generator Sprache:** System-Prompt in `app/api/ai/generate-resume/route.ts` von chinesischen Altlasten bereinigt; Lebensläufe werden nun sauber auf Deutsch oder Englisch generiert.
- **Settings-Link Fix:** Der Button "Eigenen API-Key eintragen" im Import-Dialog öffnet nun direkt das `settings`-Modal per `useUIStore` statt einer veralteten 404-Route (`/settings`).
- **Stripe Coupon Fix:** Der unzulässige Coupon-Fallback `promo_999_first_month` in `src/lib/stripe/config.ts` wurde entfernt, um Checkout-Fehler im Stripe-Portal zu verhindern.

