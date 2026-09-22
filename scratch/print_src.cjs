const fs = require('fs');
const results = JSON.parse(fs.readFileSync('./scratch/branding_scan_results.json', 'utf8'));
const srcResults = results.filter(r => r.file.startsWith('src/'));
srcResults.forEach(r => {
  console.log(`${r.file}:${r.line} [${r.match}] -> ${r.context}`);
});
