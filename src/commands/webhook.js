import { createServer } from 'http';
import { getClient } from '../client.js';

export async function webhookListen(port, flags) {
  const client = getClient(flags);
  const events = [];

  console.log(`\n  QPay Webhook Listener`);
  console.log(`  Listening on http://localhost:${port}`);
  console.log(`  Point your QPAY_CALLBACK_URL to this address.`);
  console.log(`  Press Ctrl+C to stop.\n`);

  const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // GET /events — return event log
    if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(events, null, 2));
      return;
    }

    // GET / — dashboard
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dashboardHTML(port));
      return;
    }

    // POST — webhook handler
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        const timestamp = new Date().toISOString();
        let data = {};
        try {
          data = JSON.parse(body);
        } catch {
          data = { raw: body };
        }

        const invoiceId = data.invoice_id || data.invoiceId || '';
        const event = {
          timestamp,
          invoiceId,
          body: data,
          verified: false,
          payment: null,
        };

        // Verify payment
        if (invoiceId) {
          try {
            const result = await client.checkPayment({
              objectType: 'INVOICE',
              objectId: invoiceId,
            });
            const paid = result.rows && result.rows.length > 0;
            event.verified = paid;
            event.payment = paid ? result.rows[0] : null;
          } catch (err) {
            event.error = err.message;
          }
        }

        events.unshift(event);

        // Console output
        const status = event.verified ? '\x1b[32mPAID\x1b[0m' : '\x1b[33mUNPAID\x1b[0m';
        console.log(`  [${timestamp.slice(11, 19)}] ${status} ${invoiceId}`);
        if (event.payment) {
          console.log(`    Amount: ${event.payment.amount || '—'}`);
        }
        if (event.error) {
          console.log(`    Error: ${event.error}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: event.verified ? 'paid' : 'unpaid' }));
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n  Stopped. ${events.length} events received.`);
    server.close();
    process.exit(0);
  });
}

function dashboardHTML(port) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>QPay Webhook Listener</title>
  <style>
    body { font-family: system-ui; max-width: 700px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.5rem; }
    .event { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
    .event.paid { border-color: #22c55e; background: #f0fdf4; }
    .event.unpaid { border-color: #eab308; background: #fefce8; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.paid { background: #22c55e; color: white; }
    .badge.unpaid { background: #eab308; color: white; }
    pre { font-size: 0.8rem; overflow-x: auto; }
    .empty { text-align: center; opacity: 0.5; padding: 3rem; }
  </style>
</head>
<body>
  <h1>QPay Webhook Listener</h1>
  <p>Listening on port ${port}. Webhook events will appear below.</p>
  <div id="events"><div class="empty">Waiting for events...</div></div>
  <script>
    async function poll() {
      try {
        const res = await fetch('/events');
        const events = await res.json();
        if (events.length === 0) return;
        document.getElementById('events').innerHTML = events.map(e => \`
          <div class="event \${e.verified ? 'paid' : 'unpaid'}">
            <span class="badge \${e.verified ? 'paid' : 'unpaid'}">\${e.verified ? 'PAID' : 'UNPAID'}</span>
            <strong>\${e.invoiceId || 'unknown'}</strong>
            <span style="opacity:0.5;float:right">\${e.timestamp.slice(11,19)}</span>
            <pre>\${JSON.stringify(e.body, null, 2)}</pre>
          </div>
        \`).join('');
      } catch {}
    }
    setInterval(poll, 2000);
    poll();
  </script>
</body>
</html>`;
}
