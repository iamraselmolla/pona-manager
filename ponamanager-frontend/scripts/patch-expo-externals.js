#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function sanitizeOnWindows(name) {
  if (process.platform !== 'win32') return name;
  return name.replace(/[<>:"\/\\|?*]/g, '_');
}

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'cli',
  'src',
  'start',
  'server',
  'metro',
  'externals.ts',
);

if (!fs.existsSync(target)) {
  console.log('patch-expo-externals: target not found, skipping:', target);
  process.exit(0);
}

let src = fs.readFileSync(target, 'utf8');
let modified = src;

// Add sanitize function if not present
if (!/function\s+sanitizeName\(/.test(modified)) {
  const insertPoint = modified.indexOf('\n', modified.indexOf('import '));
  const sanitizeFn = `\nfunction sanitizeName(name){\n  if (process.platform!=='win32') return name;\n  return name.replace(/[<>:\\"\\/\\\\|?*]/g,'_');\n}\n`;
  modified = modified.slice(0, insertPoint + 1) + sanitizeFn + modified.slice(insertPoint + 1);
}

// Replace path.join(externalsPath, name) with sanitized variant
modified = modified.replace(
  /path\.join\(externalsPath,\s*name\)/g,
  "path.join(externalsPath, sanitizeName(name)).replace(/\\\\/g, '/')",
);
modified = modified.replace(
  /path\.resolve\(externalsPath,\s*name\)/g,
  "path.resolve(externalsPath, sanitizeName(name)).replace(/\\\\/g, '/')",
);

if (modified !== src) {
  fs.copyFileSync(target, target + '.bak');
  fs.writeFileSync(target, modified, 'utf8');
  console.log('patch-expo-externals: patched', target);
} else {
  console.log('patch-expo-externals: no changes required');
}
