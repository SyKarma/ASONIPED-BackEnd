CREATE TABLE personal_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  pcd_name ENUM('fisica', 'visual', 'auditiva', 'psicosocial', 'cognitiva', 'intelectual', 'multiple') NOT NULL,
  cedula VARCHAR(50) UNIQUE NOT NULL,
  gender ENUM('male', 'female', 'other'),
  birth_date DATE,
  birth_place VARCHAR(255),
  address TEXT,
  province VARCHAR(100),
  canton VARCHAR(100),
  district VARCHAR(100),
  phone VARCHAR(20) NULL,
  mother_name VARCHAR(255) NULL,
  mother_cedula VARCHAR(50) NULL,
  mother_phone VARCHAR(20) NULL,
  father_name VARCHAR(255) NULL,
  father_cedula VARCHAR(50) NULL,
  father_phone VARCHAR(20) NULL,
  legal_guardian_name VARCHAR(255) NULL,
  legal_guardian_cedula VARCHAR(50) NULL,
  legal_guardian_phone VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

CREATE INDEX idx_personal_data_cedula ON personal_data(cedula);
CREATE INDEX idx_personal_data_province_canton ON personal_data(province, canton);