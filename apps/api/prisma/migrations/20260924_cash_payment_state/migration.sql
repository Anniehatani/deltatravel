ALTER TABLE "DON_DAT_TOUR"
  ADD COLUMN IF NOT EXISTS "cashDueAt" TIMESTAMPTZ(3);

CREATE INDEX IF NOT EXISTS "DON_DAT_TOUR_status_cashDueAt_idx"
  ON "DON_DAT_TOUR"("status", "cashDueAt");

ALTER TABLE "DON_DAT_TOUR"
  ADD CONSTRAINT cash_due_required_for_cash_state
  CHECK (status <> 'AWAITING_CASH' OR "cashDueAt" IS NOT NULL);

ALTER TABLE "DON_DAT_TOUR"
  ADD CONSTRAINT cash_due_after_creation
  CHECK ("cashDueAt" IS NULL OR "cashDueAt" > "createdAt");
