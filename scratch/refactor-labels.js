const fs = require('fs');
const path = require('path');

const previewDir = path.join(__dirname, '../src/components/preview/templates');
const exportDir = path.join(__dirname, '../src/app/api/resume/[id]/export/templates');

const labelMap = {
  'Age': 'age',
  'Political': 'politicalStatus',
  'Gender': 'gender',
  'Ethnicity': 'ethnicity',
  'Hometown': 'hometown',
  'Marital': 'maritalStatus',
  'Experience': 'yearsOfExperience',
  'Education': 'educationLevel',
  'Email': 'email',
  'Phone': 'phone',
  'WeChat': 'wechat',
  'Location': 'location',
  'Web': 'website',
  'LinkedIn': 'linkedin',
  'GitHub': 'github'
};

function processReactTemplates() {
  const files = fs.readdirSync(previewDir).filter(f => f.endsWith('.tsx'));
  
  for (const file of files) {
    const filePath = path.join(previewDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Check if we need to add the import
    const needsImport = Object.keys(labelMap).some(key => content.includes(`>${key}:</span>`));
    if (needsImport && !content.includes('getLabel')) {
      // Add import after the first import block
      const lastImportMatch = [...content.matchAll(/^import .*;$/gm)].pop();
      if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPos) + "\nimport { getLabel } from '@/lib/pdf/i18n-labels';" + content.slice(insertPos);
      } else {
        content = "import { getLabel } from '@/lib/pdf/i18n-labels';\n" + content;
      }
    }

    for (const [enLabel, key] of Object.entries(labelMap)) {
      const regex = new RegExp(`>\\s*${enLabel}:\\s*</span>`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `>{getLabel('${key}', resume.language)}:</span>`);
        changed = true;
      }
      
      const regex2 = new RegExp(`>\\s*${enLabel}:\\s*</p>`, 'g');
      if (regex2.test(content)) {
        content = content.replace(regex2, `>{getLabel('${key}', resume.language)}:</p>`);
        changed = true;
      }
      
      const regex3 = new RegExp(`>\\s*${enLabel}:\\s*</div>`, 'g');
      if (regex3.test(content)) {
        content = content.replace(regex3, `>{getLabel('${key}', resume.language)}:</div>`);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated React template: ${file}`);
    }
  }
}

function processNodeTemplates() {
  const files = fs.readdirSync(exportDir).filter(f => f.endsWith('.ts'));
  
  for (const file of files) {
    const filePath = path.join(exportDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Check if we need to add the import
    const needsImport = Object.keys(labelMap).some(key => content.includes(`>${key}:<`));
    if (needsImport && !content.includes('getLabel')) {
      const lastImportMatch = [...content.matchAll(/^import .*;/gm)].pop();
      if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPos) + "\nimport { getLabel } from '@/lib/pdf/i18n-labels';" + content.slice(insertPos);
      } else {
        content = "import { getLabel } from '@/lib/pdf/i18n-labels';\n" + content;
      }
    }

    for (const [enLabel, key] of Object.entries(labelMap)) {
      // In Node templates, they use template literals
      const regex = new RegExp(`>\\s*${enLabel}:\\s*<`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `>\${esc(getLabel('${key}', lang))}:<`);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated Node template: ${file}`);
    }
  }
}

console.log('Starting refactor...');
processReactTemplates();
processNodeTemplates();
console.log('Done.');
