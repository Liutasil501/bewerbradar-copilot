const fs = require('fs');
const path = require('path');

const dirs = [
  'C:/Games/Dev/JadeAI/src/components/preview/templates',
  'C:/Games/Dev/JadeAI/src/app/api/resume/[id]/export/templates'
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    
    content = content.replaceAll("=== 'zh' ? '至今' : 'Present'", "=== 'de' ? 'Heute' : 'Present'");
    content = content.replaceAll("=== 'zh' ? '技术栈' : 'Tech'", "=== 'de' ? 'Technologien' : 'Tech'");
    content = content.replaceAll("=== 'zh' ? '技术栈' : 'Methods/Tools'", "=== 'de' ? 'Methoden/Tools' : 'Methods/Tools'");
    content = content.replaceAll("=== 'zh' ? '技术栈' : 'Technologies'", "=== 'de' ? 'Technologien' : 'Technologies'");
    content = content.replaceAll("lang === 'zh' ? '至今' : 'Present'", "lang === 'de' ? 'Heute' : 'Present'");
    content = content.replaceAll("lang === 'zh' ? '技术栈' : 'Tech'", "lang === 'de' ? 'Technologien' : 'Tech'");
    content = content.replaceAll("lang === 'zh' ? '技术栈' : 'Methods/Tools'", "lang === 'de' ? 'Methoden/Tools' : 'Methods/Tools'");
    content = content.replaceAll("lang === 'zh' ? '技术栈' : 'Technologies'", "lang === 'de' ? 'Technologien' : 'Technologies'");

  
    fs.writeFileSync(p, content);
  }
}
console.log('Fixed export templates');
console.log('Fixed templates');
