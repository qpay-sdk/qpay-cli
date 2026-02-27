import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.qpay');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export const config = {
  load() {
    // Environment variables take priority
    const env = {
      baseUrl: process.env.QPAY_BASE_URL,
      username: process.env.QPAY_USERNAME,
      password: process.env.QPAY_PASSWORD,
      invoiceCode: process.env.QPAY_INVOICE_CODE,
      callbackUrl: process.env.QPAY_CALLBACK_URL,
    };

    // Load file config
    let file = {};
    if (existsSync(CONFIG_FILE)) {
      try {
        file = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
      } catch {}
    }

    return {
      baseUrl: env.baseUrl || file.baseUrl || 'https://merchant.qpay.mn',
      username: env.username || file.username || '',
      password: env.password || file.password || '',
      invoiceCode: env.invoiceCode || file.invoiceCode || '',
      callbackUrl: env.callbackUrl || file.callbackUrl || '',
    };
  },

  save(cfg) {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + '\n');
  },
};
