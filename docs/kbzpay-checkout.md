# KBZPay checkout

The checkout uses the original, unmodified static payment image at:

`public/kbzpay-qr.png`

Do not recreate, resize, screenshot, or run the QR through generative image tools. The checkout deliberately shows an unavailable warning if this exact static asset is missing.

Expected recipient shown by the supplied QR:

- Name: U Thaw Zin Oo
- Masked account: `******0772`

Flow:

1. The student selects KBZPay.
2. The checkout displays the static QR and a save-to-phone action.
3. The student scans the QR and verifies the recipient.
4. A successful payment-slip image is required before submission.
5. `/api/submit-transaction` creates a pending transaction and its payment audit event atomically.
6. An administrator verifies the slip and approves or cancels the transaction.
