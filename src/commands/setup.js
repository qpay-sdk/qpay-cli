import { createInterface } from 'readline';
import { config } from '../config.js';

function question(rl, prompt, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise((resolve) => {
    rl.question(`  ${prompt}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

function questionHidden(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(`  ${prompt}: `, (answer) => {
      resolve(answer.trim());
    });
  });
}

export async function setup() {
  const existing = config.load();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n  QPay CLI Setup');
  console.log('  Configure your QPay merchant credentials.\n');

  const baseUrl = await question(rl, 'Base URL', existing.baseUrl || 'https://merchant.qpay.mn');
  const username = await question(rl, 'Username', existing.username);
  const password = await questionHidden(rl, 'Password');
  const invoiceCode = await question(rl, 'Invoice Code', existing.invoiceCode);
  const callbackUrl = await question(rl, 'Callback URL', existing.callbackUrl);

  rl.close();

  const cfg = {
    baseUrl,
    username,
    password: password || existing.password,
    invoiceCode,
    callbackUrl,
  };

  config.save(cfg);
  console.log('\n  Configuration saved to ~/.qpay/config.json');
  console.log('  You can now use `qpay invoice create` to create invoices.\n');
}
