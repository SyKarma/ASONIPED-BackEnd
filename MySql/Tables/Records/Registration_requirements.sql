CREATE TABLE registration_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  medical_diagnosis_doc BOOLEAN DEFAULT FALSE,
  birth_certificate_doc BOOLEAN DEFAULT FALSE,
  family_cedulas_doc BOOLEAN DEFAULT FALSE,
  passport_photo_doc BOOLEAN DEFAULT FALSE,
  pension_certificate_doc BOOLEAN DEFAULT FALSE,
  study_certificate_doc BOOLEAN DEFAULT FALSE,
  bank_account_info VARCHAR(255),
  affiliation_fee_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);