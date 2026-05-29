const fs = require('fs');
const path = require('path');

const replacements = [
  // Storage keys
  { from: /jade_fingerprint/g, to: 'br_fingerprint' },
  { from: /jadeai-brand/g, to: 'bewerbradar-brand' },
  { from: /jade_api_key/g, to: 'br_api_key' },
  { from: /jade_provider_configs/g, to: 'br_provider_configs' },
  { from: /jade_tour_/g, to: 'br_tour_' },

  // Text occurrences
  { from: /JadeAI/g, to: 'BewerbRadar' },
  { from: /Jade AI/g, to: 'BewerbRadar' },
  { from: /jadeai\.app/g, to: 'bewerbradar.de' },

  // GitHub links
  { from: /twwch\/JadeAI/g, to: 'BewerbRadar/BewerbRadar' },
  { from: /https:\/\/github\.com\/example\/jadeai/g, to: 'https://bewerbradar.de' }
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

  // Manual specific replacements first
  if (file === 'package.json') {
    newContent = newContent.replace(/"name": "jadeai"/, '"name": "bewerbradar"');
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

console.log(`Rebranding complete! ${changedFiles} files updated.`);
