CREATE TABLE record_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  document_type ENUM('medical_diagnosis', 'birth_certificate', 'cedula', 'photo', 'pension_certificate', 'study_certificate', 'copias_cedulas_familia', 'pension_alimentaria', 'cuenta_banco_nacional', 'other', 'payment_info') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INT,
  original_name VARCHAR(255),
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  google_drive_id VARCHAR(255),
  google_drive_url TEXT,
  google_drive_name VARCHAR(255),
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id)
);