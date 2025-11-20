-- Migration: add_role_column.sql
-- Adds a 'role' column to the users table and normalizes existing values.
-- Run this against your database (make a backup first).

/*
  Usage (MySQL):
  1. Backup your DB:
     mysqldump -u root -p bit_meeting_test > bit_meeting_test_backup.sql

  2. Run this migration:
     mysql -u root -p bit_meeting_test < add_role_column.sql

  Or execute the statements inside your SQL client.
*/

-- Add column if it doesn't exist (MySQL 8+ supports IF NOT EXISTS)
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `role` VARCHAR(45) DEFAULT 'participant';

-- For older MySQL versions that don't support IF NOT EXISTS, you can use:
-- SET @col_exists = (
--   SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'role'
-- );
-- PREPARE stmt FROM 'ALTER TABLE `users` ADD COLUMN `role` VARCHAR(45) DEFAULT \'participant\'';
-- IF @col_exists = 0 THEN
--   EXECUTE stmt;
-- END IF;

-- Normalize existing values:
-- If some rows used 'user' or NULL or empty strings, set them to 'participant'
UPDATE `users`
SET `role` = 'participant'
WHERE `role` IS NULL OR TRIM(`role`) = '' OR LOWER(TRIM(`role`)) = 'user';

-- Optionally, set an admin account (change email to your admin's email):
-- UPDATE `users` SET `role` = 'admin' WHERE email = 'admin@example.com';

-- Verify the change
SELECT id, email, role FROM `users` LIMIT 50;
