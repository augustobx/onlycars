-- MariaDB 11.8. Additive only. Run against OnlyCars after verified backup.
-- Existing columns must be verified for compatible type/default before reapplying.
-- Old application images ignore these columns; rollback never drops them.
ALTER TABLE `Plan` ADD COLUMN IF NOT EXISTS `hubManaged` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `TenantFeature`
  ADD COLUMN IF NOT EXISTS `hubManaged` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS `hubInherit` BOOLEAN NOT NULL DEFAULT FALSE;
