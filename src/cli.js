import { config } from './config.js';
import { invoiceCreate, invoiceGet, invoiceCancel, invoiceList } from './commands/invoice.js';
import { paymentCheck } from './commands/payment.js';
import { webhookListen } from './commands/webhook.js';
import { setup } from './commands/setup.js';

const VERSION = '1.0.0';

const HELP = `
  qpay-cli v${VERSION}
  CLI tool for QPay V2 Payment API

  Usage:
    qpay <command> [options]

  Commands:
    setup                    Interactive credential setup
    invoice create           Create a new invoice
    invoice get <id>         Get invoice details
    invoice cancel <id>      Cancel an invoice
    invoice list             List recent invoices
    payment check <id>       Check payment status for an invoice
    webhook listen [port]    Start local webhook listener (default: 4040)
    config                   Show current configuration
    help                     Show this help message
    version                  Show version

  Options:
    --amount, -a <amount>    Invoice amount
    --description, -d <desc> Invoice description
    --order, -o <id>         Sender invoice number / order ID
    --json                   Output as JSON
    --sandbox                Use sandbox environment

  Environment Variables:
    QPAY_BASE_URL            QPay API base URL
    QPAY_USERNAME            Merchant username
    QPAY_PASSWORD            Merchant password
    QPAY_INVOICE_CODE        Default invoice code
    QPAY_CALLBACK_URL        Webhook callback URL

  Examples:
    qpay setup
    qpay invoice create --amount 5000 --order ORD-001
    qpay payment check INV_ID
    qpay webhook listen 4040
`;

function parseArgs(args) {
  const parsed = { command: null, subcommand: null, positional: [], flags: {} };
  let i = 0;

  // Parse command
  if (args.length > 0 && !args[0].startsWith('-')) {
    parsed.command = args[0];
    i = 1;
  }

  // Parse subcommand
  if (i < args.length && !args[i].startsWith('-')) {
    parsed.subcommand = args[i];
    i++;
  }

  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed.flags[key] = args[i + 1];
        i += 2;
      } else {
        parsed.flags[key] = true;
        i++;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const shortMap = { a: 'amount', d: 'description', o: 'order' };
      const key = shortMap[arg[1]] || arg[1];
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed.flags[key] = args[i + 1];
        i += 2;
      } else {
        parsed.flags[key] = true;
        i++;
      }
    } else {
      parsed.positional.push(arg);
      i++;
    }
  }

  return parsed;
}

function output(data, flags) {
  if (flags.json) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === 'string') {
    console.log(data);
  } else {
    for (const [key, value] of Object.entries(data)) {
      if (value != null && value !== '') {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        console.log(`  ${label}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      }
    }
  }
}

export async function run(args) {
  const { command, subcommand, positional, flags } = parseArgs(args);

  if (!command || command === 'help') {
    console.log(HELP);
    return;
  }

  if (command === 'version') {
    console.log(`qpay-cli v${VERSION}`);
    return;
  }

  if (command === 'config') {
    const cfg = config.load();
    output({
      baseUrl: cfg.baseUrl || '(not set)',
      username: cfg.username || '(not set)',
      password: cfg.password ? '********' : '(not set)',
      invoiceCode: cfg.invoiceCode || '(not set)',
      callbackUrl: cfg.callbackUrl || '(not set)',
    }, flags);
    return;
  }

  if (command === 'setup') {
    await setup();
    return;
  }

  try {
    if (command === 'invoice') {
      if (subcommand === 'create') {
        const result = await invoiceCreate(flags);
        console.log('\n  Invoice created successfully!\n');
        output(result, flags);
      } else if (subcommand === 'get') {
        const id = positional[0] || flags.id;
        if (!id) { console.error('  Error: Invoice ID required'); process.exit(1); }
        const result = await invoiceGet(id, flags);
        output(result, flags);
      } else if (subcommand === 'cancel') {
        const id = positional[0] || flags.id;
        if (!id) { console.error('  Error: Invoice ID required'); process.exit(1); }
        await invoiceCancel(id, flags);
        console.log(`  Invoice ${id} cancelled.`);
      } else if (subcommand === 'list') {
        const result = await invoiceList(flags);
        output(result, flags);
      } else {
        console.error(`  Unknown subcommand: invoice ${subcommand || ''}`);
        console.log('  Available: create, get, cancel, list');
      }
    } else if (command === 'payment') {
      if (subcommand === 'check') {
        const id = positional[0] || flags.id;
        if (!id) { console.error('  Error: Invoice ID required'); process.exit(1); }
        const result = await paymentCheck(id, flags);
        output(result, flags);
      } else {
        console.error(`  Unknown subcommand: payment ${subcommand || ''}`);
        console.log('  Available: check');
      }
    } else if (command === 'webhook') {
      if (subcommand === 'listen') {
        const port = parseInt(positional[0] || flags.port || '4040', 10);
        await webhookListen(port, flags);
      } else {
        console.error(`  Unknown subcommand: webhook ${subcommand || ''}`);
        console.log('  Available: listen');
      }
    } else {
      console.error(`  Unknown command: ${command}`);
      console.log(HELP);
    }
  } catch (err) {
    console.error(`\n  Error: ${err.message}`);
    if (flags.json) {
      console.log(JSON.stringify({ error: err.message }, null, 2));
    }
    process.exit(1);
  }
}
