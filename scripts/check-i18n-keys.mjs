import fs from 'fs';

const content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

// Find section boundaries
const ruStart = content.indexOf("ru: {") + 5;
const enStart = content.indexOf("en: {");
const zhStart = content.indexOf("zh: {");
const end = content.indexOf("} as const");

const ruSection = content.slice(ruStart, enStart);
const enSection = content.slice(enStart + 5, zhStart);
const zhSection = content.slice(zhStart + 5, end);

// Extract keys
const keyRegex = /'([^']+)'[ ]*:/g;
const extractKeys = (section) => {
  const keys = new Set();
  let match;
  while ((match = keyRegex.exec(section)) !== null) {
    keys.add(match[1]);
  }
  return keys;
};

const ruKeys = extractKeys(ruSection);
const enKeys = extractKeys(enSection);
const zhKeys = extractKeys(zhSection);

const reportMissing = (source, target, sourceKeys, targetKeys) => {
  const missing = [...sourceKeys].filter((k) => !targetKeys.has(k));
  if (missing.length > 0) {
    console.log(`\nMissing ${target} keys (found in ${source}): ${missing.length}`);
    missing.forEach((k) => console.log(`  ${k}`));
  } else {
    console.log(`${source} -> ${target}: All keys present`);
  }
};

console.log('i18n key parity check');
console.log(`RU: ${ruKeys.size} keys | EN: ${enKeys.size} keys | ZH: ${zhKeys.size} keys`);

reportMissing('RU', 'EN', ruKeys, enKeys);
reportMissing('RU', 'ZH', ruKeys, zhKeys);
reportMissing('EN', 'ZH', enKeys, zhKeys);
