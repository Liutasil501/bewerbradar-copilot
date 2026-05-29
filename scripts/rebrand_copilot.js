const fs = require('fs');
const path = require('path');

const replacements = [
  // Text occurrences
  { from: /BewerbRadar/g, to: 'BewerbRadar Copilot' },
  { from: /BewerbRadar Copilot Copilot/g, to: 'BewerbRadar Copilot' }, // In case I double replace
  
  // URL occurrences
  { from: /bewerbradar\.de/g, to: 'copilot.bewerbradar.de' },
  { from: /copilot\.copilot/g, to: 'copilot' },

  // GitHub links
  { from: /BewerbRadar\/BewerbRadar/g, to: 'Liutasil501/bewerbradar-copilot' },
  { from: /BewerbRadar Copilot\/BewerbRadar Copilot/g, to: 'Liutasil501/bewerbradar-copilot' }
];

const dirsToScan = ['src', 'messages'];
const filesToScan = ['package.json'];

function scanDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json')) {
        filesToScan.push(fullPath);
      }
    }
  }
}

for (const dir of dirsToScan) {
  if (fs.existsSync(dir)) scanDir(dir);
}

let changedFiles = 0;

for (const file of filesToScan) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  if (file === 'package.json') {
    newContent = newContent.replace(/"name": "bewerbradar"/, '"name": "bewerbradar-copilot"');
  }

  for (const r of replacements) {
    newContent = newContent.replace(r.from, r.to);
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log(`Updated: ${file}`);
  }
}

console.log(`Copilot rebranding complete! ${changedFiles} files updated.`);
