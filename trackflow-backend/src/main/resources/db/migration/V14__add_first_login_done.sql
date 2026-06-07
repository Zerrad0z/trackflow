ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_done BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET first_login_done = true WHERE is_active = true;