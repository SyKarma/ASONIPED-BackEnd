CREATE TABLE disability_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  disability_type ENUM('fisica', 'visual', 'auditiva', 'psicosocial', 'cognitiva', 'intelectual', 'multiple'),
  medical_diagnosis TEXT,
  insurance_type ENUM('rnc', 'independiente', 'privado', 'otro'),
  biomechanical_benefit ENUM('silla_ruedas', 'baston', 'andadera', 'audifono', 'baston_guia', 'otro'),
  permanent_limitations JSON,
  limitation_degree ENUM('leve', 'moderada', 'severa', 'no_se_sabe'),
  disability_origin ENUM('nacimiento', 'accidente', 'enfermedad'),
  disability_certificate ENUM('si', 'no', 'en_tramite'),
  conapdis_registration ENUM('si', 'no', 'en_tramite'),
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);