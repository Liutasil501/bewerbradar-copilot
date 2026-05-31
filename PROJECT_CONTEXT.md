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
- Wir nutzen den Hook `use-paywall.tsx`, um live zu prüfen, in welchem Tier der Nutzer ist. Gratis-Nutzer stoßen bei Premium-Aktionen auf die `PricingModal`-Komponente.
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
- `known_hosts` (SSH Known Hosts zur Verifizierung der VPS Identität)
- `MS Portfolio Brand/` (Marken-Assets und Logos)

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

### 1. Juni 2026 (Security Deep Dive & Paywall Fixes)
- **Zombie Share Loophole (Paywall Bypass):** Es gab einen Fehler in `api/share/[token]/route.ts`. Wenn ein Pro-User seinen Plan gekündigt hat (Downgrade auf 'free'), blieben seine öffentlichen Share-Links unendlich lang aktiv. Jetzt prüft das Backend bei jedem Aufruf eines Share-Links in Echtzeit den `subscriptionPlan` des Erstellers. Ist dieser 'free', wird der Link sofort gesperrt (403 Forbidden).
- **Singular Share Bypass:** Der globale Share-Toggle (`api/resume/[id]/share/route.ts`) wurde analog zu der Mehrzahl-Route abgesichert, sodass Free-User nicht den "public" State auf "true" erzwingen können.
- **Double Billing bei Stripe Upgrade:** Ein Bug in `api/stripe/checkout/route.ts` wurde behoben. Wenn Pro-User im UI auf "Upgrade" geklickt haben, wurde eine neue Checkout-Session generiert (was zu doppelten Abos führte). Jetzt werden bestehende Abonnenten dynamisch in das Stripe Customer Portal (`/api/stripe/portal`) umgeleitet, das Upgrades und Prorations sicher verarbeitet.
- **Template Lokalisierungs-Kollision (PDF & Live Preview):** In **188 Vorkommnissen** über alle Templates hinweg wurden hardcodierte chinesische Fallbacks (`language === 'zh' ? '至今' : 'Present'`) entfernt und auf die korrekte deutsche Lokalisierung (`language === 'de' ? 'Heute' : 'Present'`, `'Technologien'` etc.) umgeschrieben. Ohne diesen Fix wären deutsche Lebensläufe im PDF Export hartnäckig auf Englisch generiert worden.
- **Deployment Status:** Alle Änderungen sind derzeit nur lokal im `beta`-Branch committet (`chore(security): secure share routes, fix template language fallbacks, fix upgrade billing`). Für ein Live-Deployment müssen diese kontrolliert in den `main`-Branch gemerged und gepusht werden (gemäß der "Zero-Downtime Rule").
