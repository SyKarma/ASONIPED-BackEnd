-- Updated disability_data table structure for Phase 3 form
-- This replaces the old Disability_data.sql with the new structure

CREATE TABLE disability_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  disability_type ENUM('fisica', 'visual', 'auditiva', 'psicosocial', 'cognitiva', 'intelectual', 'multiple'),
  medical_diagnosis TEXT,
  insurance_type ENUM('rnc', 'independiente', 'privado', 'otro'),
  disability_origin ENUM('nacimiento', 'accidente', 'enfermedad'),
  disability_certificate ENUM('si', 'no', 'en_tramite'),
  conapdis_registration ENUM('si', 'no', 'en_tramite'),
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

-- Step 2: Create biomechanical_benefits table for multiple benefits
CREATE TABLE IF NOT EXISTS biomechanical_benefits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  disability_data_id INT NOT NULL,
  type ENUM('silla_ruedas', 'baston', 'andadera', 'audifono', 'baston_guia', 'otro') NOT NULL,
  other_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (disability_data_id) REFERENCES disability_data(id) ON DELETE CASCADE
);

-- Step 3: Create permanent_limitations table for detailed limitation tracking
CREATE TABLE IF NOT EXISTS permanent_limitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  disability_data_id INT NOT NULL,
  limitation ENUM('moverse_caminar', 'ver_lentes', 'oir_audifono', 'comunicarse_hablar', 'entender_aprender', 'relacionarse') NOT NULL,
  degree ENUM('leve', 'moderada', 'severa', 'no_se_sabe') NOT NULL,
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (disability_data_id) REFERENCES disability_data(id) ON DELETE CASCADE
);

-- Step 4: Create medical_additional_info table for additional medical information
CREATE TABLE IF NOT EXISTS medical_additional_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  disability_data_id INT NOT NULL,
  diseases TEXT,
  blood_type VARCHAR(10),
  medical_observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (disability_data_id) REFERENCES disability_data(id) ON DELETE CASCADE
);

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_biomechanical_benefits_disability_data_id ON biomechanical_benefits(disability_data_id);
CREATE INDEX IF NOT EXISTS idx_permanent_limitations_disability_data_id ON permanent_limitations(disability_data_id);
CREATE INDEX IF NOT EXISTS idx_medical_additional_info_disability_data_id ON medical_additional_info(disability_data_id);