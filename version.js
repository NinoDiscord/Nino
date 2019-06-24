const { join }          = require('path');
const { execSync }      = require('child_process');
const { writeFileSync } = require('fs');

module.exports = (() => {
    const rev = execSync('git rev-parse HEAD')
        .toString()
        .trim();

    const write = `export default '${rev}';`;
    writeFileSync(join(__dirname, 'src', 'core', 'hash.ts'), write);
})();