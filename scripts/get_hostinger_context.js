const fs = require('fs');
const logFile = 'C:\\Users\\schmi\\.gemini\\antigravity-ide\\brain\\73ecae61-d343-4edc-90b9-915eaf643cf1\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    if (content.toLowerCase().includes('hostinger') || content.toLowerCase().includes('vps')) {
      console.log(`[Step ${data.step_index}] ${data.source} (${data.type}):`);
      // Print first 500 chars to avoid massive output, but enough to see context
      console.log(content.substring(0, 1500));
      console.log('-----------------');
    }
  } catch(e) {}
}
