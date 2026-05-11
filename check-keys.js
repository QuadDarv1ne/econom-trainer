const fs = require('fs')
const content = fs.readFileSync('src/lib/i18n.ts', 'utf8')

// Find the RU and EN sections
const ruStart = content.indexOf("ru: {") + 5
const enStart = content.indexOf("en: {")
const end = content.indexOf("} as const")

const ruSection = content.slice(ruStart, enStart)
const enSection = content.slice(enStart + 5, end)

// Extract keys
const ruKeys = new Set()
const enKeys = new Set()

const keyRegex = /'([^']+)'[ ]*:/g
let match

while ((match = keyRegex.exec(ruSection)) !== null) {
  ruKeys.add(match[1])
}

while ((match = keyRegex.exec(enSection)) !== null) {
  enKeys.add(match[1])
}

const missing = [...ruKeys].filter(k => !enKeys.has(k))
console.log(`Missing EN keys: ${missing.length}`)
missing.forEach(k => console.log(k))
