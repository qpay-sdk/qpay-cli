import { getClient } from '../client.js';

export async function paymentCheck(invoiceId, flags) {
  const client = getClient(flags);

  const result = await client.checkPayment({
    objectType: 'INVOICE',
    objectId: invoiceId,
  });

  const paid = result.rows && result.rows.length > 0;

  if (flags.json) {
    return { paid, invoiceId, payments: result.rows || [] };
  }

  if (paid) {
    const payment = result.rows[0];
    return {
      status: 'PAID',
      invoiceId,
      paymentId: payment.paymentId || payment.payment_id,
      amount: payment.amount,
      paidAt: payment.paidDate || payment.paid_date || '',
      method: payment.paymentMethod || payment.payment_method || '',
    };
  }

  return { status: 'UNPAID', invoiceId };
}
