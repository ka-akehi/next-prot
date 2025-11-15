#!/usr/bin/env node

const { spawn } = require('node:child_process');

const userArgs = process.argv.slice(2);
const envSpec = process.env.CYPRESS_SPEC || process.env.SPEC;
const hasSpecArg = userArgs.includes('--spec');
const cypressArgs = ['cypress', 'run', ...userArgs];

if (envSpec && !hasSpecArg) {
  cypressArgs.push('--spec', envSpec);
}

const child = spawn('npx', cypressArgs, { stdio: 'inherit', shell: true });

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
