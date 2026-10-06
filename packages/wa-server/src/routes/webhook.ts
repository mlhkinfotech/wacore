import { Router } from 'express';
import type { NotificationQueue } from '../notifications/queue.js';

export const createWebhookRoutes = (queue: NotificationQueue): Router => {
  const router = Router();

  // POS / ERP event webhook
  router.post('/pos-event', (req, res) => {
    const { event, data } = req.body;

    if (!event || !data) {
      return res.status(400).json({ error: 'event and data required' });
    }

    try {
      if (event === 'sell.created' && data.customerPhone) {
        const msg = `*Bill Generated*\n\nInvoice: ${data.invoiceNo || 'N/A'}\nTotal Amount: Rs.${data.amount || 0}\nStatus: ${data.paymentStatus || 'Due'}\n\nThank you for shopping with us!`;
        queue.enqueue(data.customerPhone, msg, 'bill_alert');
      } else if (event === 'payment.received' && data.customerPhone) {
        const msg = `*Payment Received*\n\nInvoice: ${data.invoiceNo || 'N/A'}\nAmount: Rs.${data.amount || 0}\n\nThank you! Payment has been recorded.`;
        queue.enqueue(data.customerPhone, msg, 'payment_receipt');
      }

      res.json({ success: true, event });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
