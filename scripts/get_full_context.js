const fs = require('fs');
const logFile = 'C:\\Users\\schmi\\.gemini\\antigravity-ide\\brain\\73ecae61-d343-4edc-90b9-915eaf643cf1\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT' && data.content) {
      console.log(`[Step ${data.step_index}] USER: ${data.content.substring(0, 300)}`);
    } else if (data.type === 'MODEL' && data.content && (data.content.toLowerCase().includes('vercel') || data.content.toLowerCase().includes('vps'))) {
      // Just check if we talked about Vercel/VPS
      // console.log(`[Step ${data.step_index}] MODEL mentioned Vercel/VPS`);
    }
  } catch(e) {}
}
