const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js'),
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  let code = fs.readFileSync(filePath, 'utf8');

  // Replace unsupported color function throwing with safe fallback
  const errorThrowPattern = /throw new Error\(\s*["']Attempting to parse an unsupported color function/g;
  if (errorThrowPattern.test(code)) {
    code = code.replace(
      /if\s*\(\s*typeof\s+colorFunction\s*===\s*['"]undefined['"]\s*\)\s*\{\s*throw new Error\(\s*["']Attempting to parse an unsupported color function ["']\s*\+\s*value\.name\s*\+\s*["']["']\s*\);\s*\}/g,
      'if (typeof colorFunction === "undefined") { return 0x00000000; }'
    );
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[patch-html2canvas] Successfully patched ${path.basename(filePath)} to safely handle oklch and modern colors.`);
  } else {
    console.log(`[patch-html2canvas] Already patched or pattern not found in ${path.basename(filePath)}.`);
  }
}
