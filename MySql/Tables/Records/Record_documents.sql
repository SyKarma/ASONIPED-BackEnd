CREATE TABLE record_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  document_type ENUM('medical_diagnosis', 'birth_certificate', 'cedula', 'photo', 'pension_certificate', 'study_certificate', 'other'),
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INT,
  original_name VARCHAR(255),
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id)
);
