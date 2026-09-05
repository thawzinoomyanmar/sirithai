-- Append-only payment status history and indexed user payment lookups.

PRAGMA foreign_keys = ON;

ALTER TABLE transactions ADD COLUMN updated_at TEXT;

UPDATE transactions
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS payment_status_logs (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  user_id TEXT,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  reason TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(metadata_json) AND json_type(metadata_json) = 'object'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Give existing payments a baseline event without pretending their full history is known.
INSERT INTO payment_status_logs (
  id, transaction_id, user_id, previous_status, new_status, changed_by, metadata_json, created_at
)
SELECT
  lower(hex(randomblob(16))), id, user_id, NULL, COALESCE(status, 'pending'),
  'migration', '{"historicalSnapshot":true}', COALESCE(created_at, CURRENT_TIMESTAMP)
FROM transactions
WHERE NOT EXISTS (
  SELECT 1 FROM payment_status_logs psl WHERE psl.transaction_id = transactions.id
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON transactions(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_created
  ON transactions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_created
  ON payment_status_logs(transaction_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_created
  ON payment_status_logs(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_status_created
  ON payment_status_logs(user_id, new_status, created_at DESC);
