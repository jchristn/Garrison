// Builds the JavaScript SDK in ../sdk/js, which the app UI uses for its gateway client (@garrison/sdk/gateway, a
// file: dependency). Runs after npm install or npm ci (postinstall) and before npm run build (prebuild), so a fresh
// checkout, CI, and the dashboard image build all get the SDK's dist/ first. It installs the SDK's own dependencies
// (only the TypeScript compiler) with npm ci when they are missing.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sdk = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'sdk', 'js');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const result = spawnSync(npm, args, { cwd: sdk, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`build-sdk: npm ${args.join(' ')} failed in ${sdk}`);
    process.exit(result.status || 1);
  }
}

if (!existsSync(join(sdk, 'package.json'))) {
  console.error(`build-sdk: the JavaScript SDK was not found at ${sdk}. The app UI builds from a full repository checkout.`);
  process.exit(1);
}
if (!existsSync(join(sdk, 'node_modules', 'typescript'))) run(['ci', '--no-audit', '--no-fund']);
run(['run', 'build']);
