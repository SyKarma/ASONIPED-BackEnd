-- =====================================================
-- SISTEMA DE EXPEDIENTES ASONIPED - SCRIPT COMPLETO
-- =====================================================
-- Este archivo contiene todos los scripts SQL necesarios
-- para crear y configurar el sistema de expedientes
-- Fecha de creación: Diciembre 2024
-- =====================================================

USE asonipeddigitaltest;

-- =====================================================
-- 1. TABLA PRINCIPAL DE EXPEDIENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('draft', 'pending', 'approved', 'rejected', 'active', 'inactive') DEFAULT 'pending',
  phase ENUM('phase1', 'phase2', 'phase3', 'phase4', 'completed') DEFAULT 'phase1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  INDEX idx_records_status (status),
  INDEX idx_records_phase (phase),
  INDEX idx_records_created_at (created_at),
  INDEX idx_records_number (record_number)
);

-- =====================================================
-- 2. TABLA DE DATOS PERSONALES
-- =====================================================
CREATE TABLE IF NOT EXISTS personal_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  cedula VARCHAR(50) UNIQUE NOT NULL,
  pcd_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  gender ENUM('male', 'female', 'other'),
  nationality VARCHAR(100),
  address TEXT,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  relationship_to_emergency_contact VARCHAR(100),
  birth_place VARCHAR(255),
  province VARCHAR(100),
  district VARCHAR(100),
  mother_name VARCHAR(255),
  mother_cedula VARCHAR(50),
  father_name VARCHAR(255),
  father_cedula VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  INDEX idx_personal_data_cedula (cedula),
  INDEX idx_personal_data_record_id (record_id),
  INDEX idx_personal_data_full_name (full_name)
);

-- =====================================================
-- 3. TABLA DE DATOS DE DISCAPACIDAD
-- =====================================================
CREATE TABLE IF NOT EXISTS disability_data (
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
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  INDEX idx_disability_data_type (disability_type),
  INDEX idx_disability_data_record_id (record_id)
);

-- =====================================================
-- 4. TABLA DE REQUISITOS DE INSCRIPCIÓN
-- =====================================================
CREATE TABLE IF NOT EXISTS registration_requirements (
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
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  INDEX idx_registration_requirements_record_id (record_id)
);

-- =====================================================
-- 5. TABLA DE BOLETA DE MATRÍCULA
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollment_form (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  enrollment_date DATE,
  applicant_full_name VARCHAR(255),
  applicant_cedula VARCHAR(50),
  applicant_birth_date DATE,
  applicant_age INT,
  nationality VARCHAR(100),
  home_address TEXT,
  medical_conditions TEXT,
  blood_type VARCHAR(10),
  mother_name VARCHAR(255),
  mother_occupation VARCHAR(255),
  father_name VARCHAR(255),
  father_occupation VARCHAR(255),
  emergency_phones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  INDEX idx_enrollment_form_record_id (record_id)
);

-- =====================================================
-- 6. TABLA DE FICHA SOCIOECONÓMICA
-- =====================================================
CREATE TABLE IF NOT EXISTS socioeconomic_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  full_name VARCHAR(255),
  age INT,
  birth_date DATE,
  origin_place VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  family_nucleus JSON,
  responsible_person JSON,
  working_people JSON,
  housing_type ENUM('casa_propia', 'alquilada', 'prestada'),
  services JSON,
  family_income ENUM('menos_200k', '200k_400k', '400k_600k', '600k_800k', '800k_1000k', '1000k_1300k', 'mas_1300k'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  INDEX idx_socioeconomic_data_record_id (record_id)
);

-- =====================================================
-- 7. TABLA DE DOCUMENTOS ADJUNTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS record_documents (
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
  INDEX idx_documents_record_id (record_id),
  INDEX idx_documents_type (document_type)
);

-- =====================================================
-- 8. TABLA DE NOTAS ADMINISTRATIVAS
-- =====================================================
CREATE TABLE IF NOT EXISTS record_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  note TEXT NOT NULL,
  type ENUM('note', 'activity', 'milestone') DEFAULT 'note',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  INDEX idx_notes_record_id (record_id),
  INDEX idx_notes_created_at (created_at),
  INDEX idx_notes_type (type)
);

-- =====================================================
-- SCRIPTS DE MODIFICACIÓN Y CORRECCIÓN
-- =====================================================

-- Agregar columna phase a records si no existe
ALTER TABLE records 
ADD COLUMN IF NOT EXISTS phase ENUM('phase1', 'phase2', 'phase3', 'phase4', 'completed') DEFAULT 'phase1' AFTER status;

-- Agregar columna updated_at a record_notes si no existe
ALTER TABLE record_notes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Corregir foreign key de created_by en records (permitir cualquier usuario)
-- Primero eliminar la foreign key existente si existe
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = 'asonipeddigitaltest' 
  AND TABLE_NAME = 'records' 
  AND COLUMN_NAME = 'created_by' 
  AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE records DROP FOREIGN KEY ', @constraint_name), 
  'SELECT "No foreign key found" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice simple para created_by
ALTER TABLE records 
ADD INDEX IF NOT EXISTS idx_records_created_by (created_by);

-- =====================================================
-- SCRIPTS DE VERIFICACIÓN
-- =====================================================

-- Verificar estructura de tablas
SELECT 'Verificando estructura de tablas...' as info;

-- Verificar tabla records
DESCRIBE records;

-- Verificar tabla personal_data
DESCRIBE personal_data;

-- Verificar tabla record_notes
DESCRIBE record_notes;

-- Verificar índices
SHOW INDEX FROM records;
SHOW INDEX FROM personal_data;
SHOW INDEX FROM record_notes;

-- =====================================================
-- SCRIPTS DE LIMPIEZA (OPCIONAL)
-- =====================================================

-- Eliminar datos de prueba (descomentar si es necesario)
-- DELETE FROM record_notes;
-- DELETE FROM record_documents;
-- DELETE FROM socioeconomic_data;
-- DELETE FROM enrollment_form;
-- DELETE FROM registration_requirements;
-- DELETE FROM disability_data;
-- DELETE FROM personal_data;
-- DELETE FROM records;

-- =====================================================
-- SCRIPTS DE MIGRACIÓN DE DATOS
-- =====================================================

-- Actualizar registros existentes sin phase
UPDATE records SET phase = 'phase1' WHERE phase IS NULL;

-- Actualizar registros con status 'draft' a 'pending'
UPDATE records SET status = 'pending' WHERE status = 'draft';

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para generar número de expediente
DELIMITER //
CREATE FUNCTION IF NOT EXISTS generate_record_number() 
RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE record_count INT;
  DECLARE year_val INT;
  DECLARE padded_count VARCHAR(10);
  DECLARE record_number VARCHAR(50);
  
  SELECT COUNT(*) INTO record_count FROM records;
  SET year_val = YEAR(CURRENT_DATE());
  SET padded_count = LPAD(record_count + 1, 4, '0');
  SET record_number = CONCAT('EXP-', year_val, '-', padded_count);
  
  RETURN record_number;
END //
DELIMITER ;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

-- Procedimiento para crear expediente completo
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS create_complete_record(
  IN p_full_name VARCHAR(255),
  IN p_cedula VARCHAR(50),
  IN p_pcd_name VARCHAR(255),
  IN p_created_by INT
)
BEGIN
  DECLARE new_record_id INT;
  DECLARE new_record_number VARCHAR(50);
  
  -- Generar número de expediente
  SET new_record_number = generate_record_number();
  
  -- Crear expediente principal
  INSERT INTO records (record_number, status, phase, created_by) 
  VALUES (new_record_number, 'pending', 'phase1', p_created_by);
  
  SET new_record_id = LAST_INSERT_ID();
  
  -- Crear datos personales
  INSERT INTO personal_data (record_id, full_name, cedula, pcd_name) 
  VALUES (new_record_id, p_full_name, p_cedula, p_pcd_name);
  
  -- Agregar nota inicial
  INSERT INTO record_notes (record_id, note, type, created_by) 
  VALUES (new_record_id, 'Expediente creado', 'milestone', p_created_by);
  
  SELECT new_record_id as record_id, new_record_number as record_number;
END //
DELIMITER ;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de expedientes con datos personales
CREATE OR REPLACE VIEW v_records_with_personal_data AS
SELECT 
  r.id,
  r.record_number,
  r.status,
  r.phase,
  r.created_at,
  r.updated_at,
  pd.full_name,
  pd.cedula,
  pd.pcd_name,
  pd.gender,
  pd.birth_date,
  pd.address,
  pd.phone_number,
  pd.email
FROM records r
LEFT JOIN personal_data pd ON r.id = pd.record_id
ORDER BY r.created_at DESC;

-- Vista de estadísticas de expedientes
CREATE OR REPLACE VIEW v_record_stats AS
SELECT 
  COUNT(*) as total_records,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_records,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_records,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_records,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_records,
  SUM(CASE WHEN phase = 'phase1' THEN 1 ELSE 0 END) as phase1_records,
  SUM(CASE WHEN phase = 'phase2' THEN 1 ELSE 0 END) as phase2_records,
  SUM(CASE WHEN phase = 'phase3' THEN 1 ELSE 0 END) as phase3_records,
  SUM(CASE WHEN phase = 'phase4' THEN 1 ELSE 0 END) as phase4_records,
  SUM(CASE WHEN phase = 'completed' THEN 1 ELSE 0 END) as completed_records,
  SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as this_month_records
FROM records;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_records_update 
BEFORE UPDATE ON records
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_personal_data_update 
BEFORE UPDATE ON personal_data
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- =====================================================
-- PERMISOS Y SEGURIDAD
-- =====================================================

-- Crear usuario específico para la aplicación (opcional)
-- CREATE USER IF NOT EXISTS 'asoniped_app'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON asonipeddigitaltest.* TO 'asoniped_app'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- SCRIPT DE VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas existen
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME,
  UPDATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'asonipeddigitaltest' 
AND TABLE_NAME IN ('records', 'personal_data', 'disability_data', 'registration_requirements', 'enrollment_form', 'socioeconomic_data', 'record_documents', 'record_notes')
ORDER BY TABLE_NAME;

-- Verificar índices
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  NON_UNIQUE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'asonipeddigitaltest' 
AND TABLE_NAME IN ('records', 'personal_data', 'record_notes')
ORDER BY TABLE_NAME, INDEX_NAME;

-- Mostrar estadísticas actuales
SELECT * FROM v_record_stats;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- El sistema de expedientes está listo para usar
-- Todas las tablas, índices, funciones y procedimientos han sido creados
-- =====================================================
