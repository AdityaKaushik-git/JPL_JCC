const fs = require('fs');
const content = require('fs').readFileSync('D:/JPL_JCC/scripts/content_api.txt', 'utf8');
fs.writeFileSync('D:/JPL_JCC/client/src/services/api.js', content, 'utf8');
console.log('api.js written');
