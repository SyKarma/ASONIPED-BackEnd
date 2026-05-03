ALTER TABLE personal_data
  ADD COLUMN mother_occupation VARCHAR(255) NULL AFTER mother_phone,
  ADD COLUMN father_occupation VARCHAR(255) NULL AFTER father_phone,
  ADD COLUMN legal_guardian_occupation VARCHAR(255) NULL AFTER legal_guardian_phone;
