const fs = require('fs');
const logFile = 'C:\\Users\\schmi\\.gemini\\antigravity-ide\\brain\\73ecae61-d343-4edc-90b9-915eaf643cf1\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.source === 'MODEL' && data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'run_command' || tc.name === 'default_api:run_command') {
          console.log(`[Step ${data.step_index}] COMMAND: ${tc.args.CommandLine}`);
        }
      }
    }
  } catch(e) {}
}
