import fs from 'fs';
import('./src/index.js').catch(e => {
    fs.writeFileSync('error-log.json', JSON.stringify({ message: e.message, stack: e.stack }, null, 2));
});
