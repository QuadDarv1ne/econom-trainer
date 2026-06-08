import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/lib/locales');

const files = {
  RU: path.join(localesDir, 'ru.ts'),
  EN: path.join(localesDir, 'en.ts'),
  ZH: path.join(localesDir, 'zh.ts'),
};

const keyRegex = /'([^']+)'\s*:/g;

function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = new Set();
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    // Skip non-translation keys like TypeScript annotations or imports
    if (key.includes(' ') || key === '') continue;
    keys.add(key);
  }
  return keys;
}

const ruKeys = extractKeys(files.RU);
const enKeys = extractKeys(files.EN);
const zhKeys = extractKeys(files.ZH);

console.log('i18n key parity check');
console.log(`RU: ${ruKeys.size} keys | EN: ${enKeys.size} keys | ZH: ${zhKeys.size} keys`);

const reportMissing = (source, target, sourceKeys, targetKeys) => {
  const missing = [...sourceKeys].filter((k) => !targetKeys.has(k));
  if (missing.length > 0) {
    console.log(`\nMissing ${target} keys (found in ${source}): ${missing.length}`);
    missing.forEach((k) => console.log(`  ${k}`));
  } else {
    console.log(`${source} -> ${target}: All keys present`);
  }
};

reportMissing('RU', 'EN', ruKeys, enKeys);
reportMissing('RU', 'ZH', ruKeys, zhKeys);
reportMissing('EN', 'ZH', enKeys, zhKeys);

// Report any extras (keys in target but not in source)
const reportExtra = (target, source, targetKeys, sourceKeys) => {
  const extra = [...targetKeys].filter((k) => !sourceKeys.has(k));
  if (extra.length > 0) {
    console.log(`\nExtra ${target} keys (not in ${source}): ${extra.length}`);
    extra.forEach((k) => console.log(`  ${k}`));
  }
};

reportExtra('RU', 'EN', ruKeys, enKeys);
reportExtra('ZH', 'EN', zhKeys, enKeys);
