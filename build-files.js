const fs = require('fs');
const p = require('path');
const w = (dest, src) => { fs.mkdirSync(p.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); console.log('OK: ' + dest); };
w('src/lib/paraphraser.js', 'paraphraser.txt');
