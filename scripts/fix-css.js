const fs = require('fs');
let content = fs.readFileSync('src/app/globals.css', 'utf8');

// Find the index of the last valid CSS block
const index = content.indexOf('@keyframes thinkingWave {');
if (index !== -1) {
  // Extract up to that block and add its content manually since we know what it is
  const safeContent = content.substring(0, index) + `@keyframes thinkingWave {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1.2); }
}

@media print {
  body::after {
    content: "Upgrade to Pro to export PDFs!";
    display: block !important;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    color: rgba(0,0,0,0.2);
    font-weight: bold;
    z-index: 9999;
    text-align: center;
    pointer-events: none;
  }
}
`;
  fs.writeFileSync('src/app/globals.css', safeContent);
  console.log("Fixed CSS encoding!");
} else {
  console.log("Could not find index");
}
