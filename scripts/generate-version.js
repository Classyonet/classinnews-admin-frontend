const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const versionJson = {
  version: pkg.version,
  buildTime: new Date().toISOString()
};

const dir = path.join(__dirname, '../public');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(
  path.join(dir, 'version.json'),
  JSON.stringify(versionJson, null, 2)
);

console.log(`Generated version.json for version ${pkg.version}`);
