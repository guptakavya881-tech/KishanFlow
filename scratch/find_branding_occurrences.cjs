const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.next', '.git'];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (excludeDirs.includes(file)) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = walk(process.cwd());
const results = [];

const pattern = /(kisan\s*flow|kishan\s+flow|kisan)/gi;

for (const filePath of allFiles) {
  // Skip binary or scratch
  if (filePath.endsWith('.png') || filePath.endsWith('.ico') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) continue;
  if (filePath.includes('scratch') || filePath.includes('.system_generated')) continue;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      let match;
      const regex = new RegExp(pattern.source, 'gi');
      while ((match = regex.exec(line)) !== null) {
        results.push({
          file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
          line: index + 1,
          match: match[0],
          context: line.trim()
        });
      }
    });
  } catch (e) {
    // Ignore read errors
  }
}

console.log(`Total occurrences found: ${results.length}`);
fs.writeFileSync(path.join(process.cwd(), 'scratch', 'branding_scan_results.json'), JSON.stringify(results, null, 2));

// Print summary by file
const fileMap = {};
results.forEach(r => {
  fileMap[r.file] = (fileMap[r.file] || 0) + 1;
});

console.log('\n--- Occurrences by File ---');
Object.entries(fileMap).sort((a, b) => b[1] - a[1]).forEach(([f, count]) => {
  console.log(`${count.toString().padStart(4)} : ${f}`);
});
