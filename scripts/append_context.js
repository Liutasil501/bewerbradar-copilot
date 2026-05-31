const fs = require('fs');
const filePath = 'C:\\Games\\Dev\\JadeAI\\PROJECT_CONTEXT.md';

const textToAppend = `

## 8. Server-Zugänge & Keys (Internes Access Management)
Die internen Zugänge und Keys zum VPS und den Hostinger-APIs liegen sicher im lokalen Verzeichnis:
\`C:\\Games\\Dev\\VPS2 NEWST 2028\`
- \`HOSTINGER API 26-05.txt\` (Hostinger API Zugänge)
- \`GITHUB_05_2026_OpenClaw.txt\` (GitHub Tokens)
- \`id_ed25519\` / \`id_ed25519.pub\` (SSH Keys für den direkten VPS Zugang)
Diese Dateien werden niemals ins Repo gepusht, sondern dienen uns als lokaler Anker für manuelle SSH-Verbindungen oder API-Verwaltungen.

---

## Changelog / Logbuch

### 29. Mai 2026
- **VPS/Docker Klärung:** Es wurde final dokumentiert, dass der Copilot intern auf Port \`3001\` (Container Port 3000) gemappt ist und über den Reverse Proxy auf \`copilot.bewerbradar.de\` läuft. Hauptprojekt (Reactive Resume) läuft auf Port \`3000\`.
- **GitHub Repos getrennt:** Um Überschneidungen zu verhindern, wurde \`Liutasil501/bewerbradar-copilot\` als separates Repo für den Copilot etabliert, statt den Code in den \`beta\`-Branch des Hauptprojekts zu drücken.
- **Drizzle Studio:** Subdomain \`studio.bewerbradar.de\` via Port \`4983\` als internes GUI ergänzt.
- **Stripe & Paywall:** Exakte Integration in den Dialog-Komponenten (\`export-dialog.tsx\` etc.) und in der SQLite Datenbank dokumentiert.
- **Bugfixes:** Lokalisierungsfehler (Chinesische Personas), \`x-next-intl-locale\` Header, Dialog-Verschachtelungs-Bugs (Radix UI) und CSS-Encoding-Fehler erfolgreich bereinigt.
- **Interne Zugänge hinterlegt:** Ablageort der VPS/Hostinger Keys (\`C:\\Games\\Dev\\VPS2 NEWST 2028\`) ins Log aufgenommen.
`;

fs.appendFileSync(filePath, textToAppend);
console.log('Appended to PROJECT_CONTEXT.md');
