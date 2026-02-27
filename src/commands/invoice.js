import { getClient } from '../client.js';
import { config } from '../config.js';

export async function invoiceCreate(flags) {
  const client = getClient(flags);
  const cfg = config.load();

  const amount = parseFloat(flags.amount);
  if (!amount || isNaN(amount)) {
    throw new Error('Amount is required. Use --amount or -a flag.');
  }

  const invoiceCode = flags.code || cfg.invoiceCode;
  if (!invoiceCode) {
    throw new Error('Invoice code is required. Use --code flag or set QPAY_INVOICE_CODE.');
  }

  const callbackUrl = flags.callback || cfg.callbackUrl;

  const request = {
    invoiceCode,
    senderInvoiceNo: flags.order || `CLI-${Date.now()}`,
    amount,
    callbackUrl: callbackUrl || undefined,
  };

  if (flags.description) {
    request.invoiceDescription = flags.description;
  }

  const invoice = await client.createSimpleInvoice(request);

  return {
    invoiceId: invoice.invoiceId,
    qrText: invoice.qrText,
    qPayShortUrl: invoice.qPayShortUrl,
    amount,
    senderInvoiceNo: request.senderInvoiceNo,
    urls: invoice.urls ? `${invoice.urls.length} bank links` : '0',
  };
}

export async function invoiceGet(invoiceId, flags) {
  const client = getClient(flags);
  const result = await client.getInvoice(invoiceId);
  return result;
}

export async function invoiceCancel(invoiceId, flags) {
  const client = getClient(flags);
  await client.cancelInvoice(invoiceId);
}

export async function invoiceList(flags) {
  // QPay V2 doesn't have a list endpoint, so this is a placeholder
  return 'Invoice list is not supported by QPay V2 API. Use invoice IDs from your records.';
}
