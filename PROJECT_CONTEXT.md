# Project Context: BewerbRadar Copilot (ehemals JadeAI)

> **WICHTIGER HINWEIS FÜR KI-AGENTEN (THE SURVIVAL GUIDE):** 
> Stell dir vor, du hast alles vergessen und fängst heute neu an. Lese diese Datei, um sofort zu verstehen, wie die Server-Architektur, das Deployment und die Paywall-Logik dieses Projekts aufgebaut sind. Lösche hier niemals Informationen, sondern ergänze nur!

---

## 1. Die Nginx-Architektur (Domains & Ports auf dem VPS)
Wir betreiben auf dem VPS mehrere Projekte parallel, die über die Nginx-Konfiguration (`bewerbradar.conf`) sauber getrennt werden. Die Ports sind intern (127.0.0.1) gemappt:

- **`bewerbradar.de` (Landing Page):**
  Ist *kein* Node-Port, sondern serviert direkt statische Dateien (`root /var/www/bewerbradar-landing`).
- **`studio.bewerbradar.de` (Das Hauptprojekt):**
  Das ist der eigentliche Resume Builder (Reactive Resume). Läuft intern auf **Port 3000**.
- **`copilot.bewerbradar.de` (Dieses Projekt hier!):**
  Das ist der BewerbRadar Copilot (ehemals JadeAI). Läuft intern auf **Port 3001**.
- **`smart.bewerbradar.de`:**
  Ist intern für ein weiteres Projekt auf **Port 3002** vorbereitet.

*Hinweis für Drizzle Studio:* Wenn lokal oder manuell auf die Datenbank-GUI zugegriffen werden muss, läuft diese nativ über `pnpm db:studio` (Standardport 4983), wird aber in der Live-Nginx-Config nicht als eigene Subdomain für Nutzer geroutet.

---

## 2. Server-Zugänge, Keys & Deployment (Internes Access Management)
- **Deployment via Hostinger:** Der VPS zieht den Code über die Hostinger Git-Integration automatisch von GitHub (`Liutasil501/bewerbradar-copilot`).
- **Die fehlenden Stripe Keys:** Aus Sicherheitsgründen liegt die `.env` Datei im `.gitignore`. Wenn Hostinger von GitHub zieht, fehlt die `.env`. Die Stripe-Keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) **müssen manuell auf dem VPS in die Docker-Umgebung eingetragen werden**.
- **Lokale Master-Keys:** Falls SSH-Zugriff oder manuelle API-Eingriffe nötig sind, liegen die Master-Dateien sicher im lokalen Entwickler-Ordner: `C:\Games\Dev\VPS2 NEWST 2028`. Hier finden sich die SSH-Schlüssel (`id_ed25519`), Hostinger-APIs und GitHub-Tokens.

---

## 3. Stripe Paywall & Datenbank (Die Business Logik)
Um den Copilot zu monetarisieren, greift ein Freemium-Modell.
- **Datenbank-Erweiterungen:** In `src/lib/db/schema.ts` wurde die `users`-Tabelle um Stripe-Felder erweitert (`stripeCustomerId`, `subscriptionPlan` [enum: free, pro, premium] etc.). Diese Felder werden über die Route `/api/stripe/webhook` automatisch aktualisiert.
- **UI Blockaden (Pricing Modal):** Die Paywall wird über den Hook `use-paywall.tsx` gesteuert und blockiert Premium-Aktionen direkt in den Dialogen:
  - `export-dialog.tsx` (PDF Download)
  - `cover-letter-dialog.tsx` (Anschreiben)
  - `interview-lobby.tsx` (KI Mock-Interview)
  - `grammar-check-dialog.tsx` (Grammatik)
  - `jd-analysis-dialog.tsx` (Job Analyse)
  - `translate-dialog.tsx` (Übersetzer)
- **Hardcodiertes Pricing:** Um Stripe-API-Calls beim Rendern der Oberfläche zu vermeiden, sind die Preise und Paketbeschreibungen (z.B. `titlePro`, `descPremium`) direkt in den Lokalisierungsdateien (`messages/de.json`, `en.json`, `zh.json`) hartcodiert.

---

## 4. Templates & Dummy-Daten
In den Dateien `src/lib/db/sample-resume.ts` und `seed.ts` sind Dummy-Daten hinterlegt. Wenn ein User ein neues Template auswählt, startet er nicht mit einem leeren Blatt, sondern sieht direkt strukturierte Beispiel-Inhalte (Max Mustermann, Beispiel-Jobs), um das Potenzial des Layouts sofort zu erkennen.

---

## Changelog / Logbuch (Historie der Entwicklungen)

### 26. Mai 2026 (Kickoff & Rebranding)
- **Rebranding:** Der Quellcode (JadeAI) wurde vollständig auf "BewerbRadar Copilot" umgeschrieben. Alle Referenzen, Prompts und Storage-Keys wurden angepasst.
- **Stripe Start:** Erste Integration der Stripe-Datenbankfelder und Start des Freemium-Modells (Pro / Premium).

### 27. Mai 2026 (Bugfixes & KI-Lokalisierung)
- **Chinesische Altlasten entfernt:** Das Mock-Interview war hart auf chinesische Prompts und Namen ("Li Wen") codiert. Wir haben `src/lib/interview/interviewers.ts` übersetzt und deutsche/englische HR-Personas gebaut.
- **Dialog-Fixes:** Das `PricingModal` hatte React-Fehler (verschachtelte `<DialogContent>` Elemente) ausgelöst, was behoben wurde, indem es als Fragment neben den Haupt-Dialog gerückt wurde.
- **CSS UTF-16 Fehler:** Eine korrumpierte `globals.css` Datei (verursacht durch PowerShell Pipes) wurde mittels Node-Script bereinigt.
- **Locale Awareness:** Die KI-Routen (`cover-letter`, `grammar-check`) nutzen nun den `x-next-intl-locale` Header, damit die KI nicht unaufgefordert Texte ins Englische oder Chinesische übersetzt.

### 29. Mai 2026 (Infrastruktur & Architektur-Sicherung)
- **Nginx-Architektur aufgeklärt:** Analyse der `bewerbradar.conf` ergab: `studio` ist das Hauptprojekt (Port 3000), `copilot` ist dieses Projekt (Port 3001) und die Hauptdomain liefert reine HTML-Landingpages.
- **GitHub Repos getrennt:** Um fatale Overwrites zu verhindern, wurde das Copilot-Projekt in ein eigenes Repo (`Liutasil501/bewerbradar-copilot`) ausgelagert. Das alte Setup (alles auf den `beta`-Branch des Hauptprojekts zu pushen) wurde als gefährlich eingestuft und rückgängig gemacht.
- **Access Management dokumentiert:** Verweis auf den internen Ordner `C:\Games\Dev\VPS2 NEWST 2028` als sichere Quelle für alle Zugangsdaten und Keys.
