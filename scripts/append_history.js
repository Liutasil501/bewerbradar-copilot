const fs = require('fs');
const filePath = 'C:\\Games\\Dev\\JadeAI\\PROJECT_CONTEXT.md';

const textToAppend = `

### 26. Mai 2026 (Architektur-Kickoff & VPS Setup)
- **Deployment Strategie:** Entscheidung gegen GitHub Actions für das Deployment. Stattdessen zieht sich der Hostinger VPS den Code direkt vom \`beta\`-Branch.
- **SSH & Env-Setup:** Da die \`.env\`-Datei (mit den sensiblen Stripe Keys) nicht auf GitHub darf, wurde sie manuell per SSH-Zugriff (\`147.93.121.183\`) auf dem VPS im Docker-Verzeichnis angelegt.
- **MCP & IDE:** Ersteinrichtung der MCP-Server in der lokalen IDE, Vergabe von Berechtigungen für das GitHub-Repository.

### 27. Mai 2026 (Hauptprojekt & Fehleranalyse)
- **Minimalinvasive Umbauten ("Option B"):** Diskussion über schonende Eingriffe in das Hauptprojekt (Reactive Resume), um zukünftige Updates nicht zu blockieren.
- **Lokalisierung (Templates):** Fokus auf Deutsch als Standard-Sprache für alle CV-Templates gesetzt.
- **Dashboard Bugfixes:** Bereinigung diverser UI-Bugs in der \`sidebar.tsx\` und im Billing-Bereich.

---

## 9. Nginx-Routing Klärung (Port 3000 vs 4983)
Du hast die \`bewerbradar.conf\` völlig richtig analysiert! Hier ist die Auflösung, warum \`studio\` auf Port 3000 gemappt ist:
- **\`bewerbradar.de\` (Hauptdomain):** Liefert nur das reine, statische Frontend (Landingpage) aus \`/var/www/bewerbradar-landing\`. Es nutzt keinen Node-Port.
- **\`studio.bewerbradar.de\`:** Das ist in eurer Konfiguration das **tatsächliche Hauptprojekt (Reactive Resume)**! Deshalb leitet Nginx hier auf **Port 3000** weiter (den Node-Server des Hauptprojekts).
- **Port 4983:** Das ist ausschließlich Drizzle Studio (die reine Datenbank-GUI). Diese wurde ursprünglich für \`studio\` angedacht, aber das Nginx-Routing beweist, dass unter "Studio" bei euch die Haupt-Applikation läuft!
- **\`copilot.bewerbradar.de\`:** Ist korrekt auf **Port 3001** geroutet (unser JadeAI Projekt).
`;

fs.appendFileSync(filePath, textToAppend);
console.log('Appended historical context and Nginx clarification to PROJECT_CONTEXT.md');
