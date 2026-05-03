-- Allow multiple disability types in Phase 1 (comma-separated codes), aligned with normalizeDisabilityTypes / Phase 3.
-- Run once on existing databases that still use ENUM for personal_data.pcd_name.

ALTER TABLE personal_data
  MODIFY COLUMN pcd_name VARCHAR(128) NOT NULL;
