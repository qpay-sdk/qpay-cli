import { QPayClient } from 'qpay-js';
import { config } from './config.js';

let _client = null;

export function getClient(flags = {}) {
  if (_client) return _client;

  const cfg = config.load();

  if (flags.sandbox) {
    cfg.baseUrl = 'https://merchant-sandbox.qpay.mn';
  }

  if (!cfg.username || !cfg.password) {
    throw new Error(
      'QPay credentials not configured.\n' +
      '  Run `qpay setup` or set QPAY_USERNAME and QPAY_PASSWORD environment variables.'
    );
  }

  _client = new QPayClient({
    baseUrl: cfg.baseUrl,
    username: cfg.username,
    password: cfg.password,
  });

  return _client;
}
