const fs = require('fs');
console.log(JSON.stringify(fs.readFileSync('.env', 'utf8')));
