-- Add reservation_number to reservation_requests
ALTER TABLE reservation_requests
ADD COLUMN reservation_number VARCHAR(16) UNIQUE;

-- Index for fast search
CREATE INDEX IF NOT EXISTS idx_reservation_number ON reservation_requests(reservation_number);