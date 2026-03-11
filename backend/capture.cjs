const { execSync } = require('child_process');
const fs = require('fs');
try {
    execSync('npx prisma generate', { encoding: 'utf8' });
    fs.writeFileSync('prisma-out.json', JSON.stringify({ success: true }));
} catch (e) {
    fs.writeFileSync('prisma-out.json', JSON.stringify({ stdout: e.stdout, stderr: e.stderr }));
}
