# qpay-cli

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/qpay-cli)](https://www.npmjs.com/package/qpay-cli)

CLI tool for the [QPay V2 Payment API](https://merchant.qpay.mn). Create invoices, check payments, and test webhooks from the terminal.

## Installation

```bash
npm install -g qpay-cli
```

Or use directly with npx:

```bash
npx qpay-cli help
```

## Setup

Configure your QPay merchant credentials:

```bash
qpay setup
```

This saves credentials to `~/.qpay/config.json`. Alternatively, set environment variables:

```bash
export QPAY_BASE_URL=https://merchant.qpay.mn
export QPAY_USERNAME=your_username
export QPAY_PASSWORD=your_password
export QPAY_INVOICE_CODE=your_invoice_code
export QPAY_CALLBACK_URL=https://yoursite.com/webhook
```

## Usage

### Create Invoice

```bash
qpay invoice create --amount 5000 --order ORD-001
qpay invoice create -a 10000 -o ORD-002 --description "Product payment"
qpay invoice create --amount 5000 --json
```

### Check Payment

```bash
qpay payment check INVOICE_ID
qpay payment check INVOICE_ID --json
```

### Cancel Invoice

```bash
qpay invoice cancel INVOICE_ID
```

### Webhook Listener

Start a local webhook listener for testing:

```bash
qpay webhook listen
qpay webhook listen 8080
```

This starts a local HTTP server that:
- Receives QPay webhook callbacks
- Automatically verifies payments via the QPay API
- Logs events to the console with color-coded status
- Provides a web dashboard at `http://localhost:4040`
- Returns event history at `GET /events`

### Configuration

```bash
qpay config          # Show current configuration
qpay setup           # Interactive setup wizard
```

### Sandbox

Use `--sandbox` flag to target the sandbox environment:

```bash
qpay invoice create --amount 100 --sandbox
```

## Commands

| Command | Description |
|---------|-------------|
| `qpay setup` | Interactive credential setup |
| `qpay invoice create` | Create a new invoice |
| `qpay invoice get <id>` | Get invoice details |
| `qpay invoice cancel <id>` | Cancel an invoice |
| `qpay payment check <id>` | Check payment status |
| `qpay webhook listen [port]` | Start webhook listener (default: 4040) |
| `qpay config` | Show current configuration |
| `qpay help` | Show help |
| `qpay version` | Show version |

## Links

- [QPay SDK Documentation](https://qpay-sdk.github.io/qpay-docs/)
- [QPay SDK GitHub](https://github.com/qpay-sdk)
- [qpay-js](https://www.npmjs.com/package/qpay-js) (base SDK)

## License

MIT
