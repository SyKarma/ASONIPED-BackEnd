-- ============================================
-- Complete Database Schema Import Script
-- Import this file directly into Railway MySQL
-- ============================================

-- ============================================
-- 1. USERS TABLES (Must be first)
-- ============================================

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User roles
CREATE TABLE user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

-- User role assignments
CREATE TABLE user_role_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES user_roles(id)
);

-- User profiles
CREATE TABLE user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  profile_type ENUM('beneficiary', 'volunteer', 'donor', 'workshop_participant') NOT NULL,
  profile_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- 2. RECORDS TABLES
-- ============================================

-- Records main table
CREATE TABLE records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('draft', 'pending', 'needs_modification', 'approved', 'rejected', 'active', 'inactive') DEFAULT 'draft',
  phase ENUM('phase1', 'phase2', 'phase3', 'phase4', 'completed') DEFAULT 'phase1',
  admin_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  handed_over_to_user BOOLEAN DEFAULT FALSE,
  handed_over_to INT NULL,
  handed_over_at TIMESTAMP NULL,
  handed_over_by INT NULL,
  FOREIGN KEY (handed_over_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Personal data
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

-- Complete personal data
CREATE TABLE complete_personal_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  record_number VARCHAR(50),
  registration_date DATE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  pcd_name VARCHAR(255),
  cedula VARCHAR(50) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  birth_date DATE NOT NULL,
  age INT,
  birth_place VARCHAR(255) NOT NULL,
  exact_address TEXT NOT NULL,
  province VARCHAR(100) NOT NULL,
  canton VARCHAR(100),
  district VARCHAR(100) NOT NULL,
  primary_phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

-- Disability data
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

-- Biomechanical benefits
CREATE TABLE IF NOT EXISTS biomechanical_benefits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  disability_data_id INT NOT NULL,
  type ENUM('silla_ruedas', 'baston', 'andadera', 'audifono', 'baston_guia', 'otro') NOT NULL,
  other_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (disability_data_id) REFERENCES disability_data(id) ON DELETE CASCADE
);

-- Permanent limitations
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

-- Medical additional info
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

-- Family information
CREATE TABLE family_information (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  mother_name VARCHAR(255),
  mother_cedula VARCHAR(50),
  mother_occupation VARCHAR(255),
  mother_phone VARCHAR(20),
  father_name VARCHAR(255),
  father_cedula VARCHAR(50),
  father_occupation VARCHAR(255),
  father_phone VARCHAR(20),
  responsible_person VARCHAR(255),
  responsible_address TEXT,
  responsible_cedula VARCHAR(50),
  responsible_occupation VARCHAR(255),
  responsible_phone VARCHAR(20),
  family_members JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

-- Enrollment form
CREATE TABLE enrollment_form (
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
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

-- Socioeconomic data
CREATE TABLE socioeconomic_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  housing_type ENUM('casa_propia', 'alquilada', 'prestada'),
  available_services JSON,
  family_income ENUM('menos_200k', '200k_400k', '200k_600k', '200k_800k', '200k_1000k', '1000k_1300k', 'mas_1300k'),
  working_family_members JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

-- Registration requirements
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

-- Record documents
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
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Record notes
CREATE TABLE record_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  note TEXT NOT NULL,
  admin_comment TEXT,
  sections_to_modify JSON,
  documents_to_replace JSON,
  modification_metadata JSON,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  resolved_at TIMESTAMP NULL,
  resolved_by INT,
  type ENUM('note', 'activity', 'milestone') DEFAULT 'note',
  modification_type ENUM('general', 'phase1_modification', 'phase3_modification', 'document_replacement') DEFAULT 'general',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Records indexes
CREATE INDEX idx_records_status ON records(status);
CREATE INDEX idx_records_created_at ON records(created_at);
CREATE INDEX idx_records_number ON records(record_number);
CREATE INDEX idx_disability_data_type ON disability_data(disability_type);
CREATE INDEX idx_disability_data_record_id ON disability_data(record_id);
CREATE INDEX idx_documents_record_id ON record_documents(record_id);
CREATE INDEX idx_documents_type ON record_documents(document_type);
CREATE INDEX idx_notes_record_id ON record_notes(record_id);
CREATE INDEX idx_notes_type ON record_notes(type);
CREATE INDEX idx_notes_created_at ON record_notes(created_at);
CREATE INDEX idx_biomechanical_benefits_disability_data_id ON biomechanical_benefits(disability_data_id);
CREATE INDEX idx_permanent_limitations_disability_data_id ON permanent_limitations(disability_data_id);
CREATE INDEX idx_medical_additional_info_disability_data_id ON medical_additional_info(disability_data_id);

-- ============================================
-- 3. DONATIONS TABLES
-- ============================================

CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NULL,
  correo VARCHAR(30) NULL,
  telefono VARCHAR(9) NULL,
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  aceptacion_privacidad BOOLEAN NOT NULL,
  aceptacion_comunicacion BOOLEAN NOT NULL
);

CREATE TABLE donation_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL,
  user_id INT NULL,
  status ENUM('open', 'closed', 'archived') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  assigned_admin_id INT NULL,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS anonymous_tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id VARCHAR(20) UNIQUE NOT NULL COMMENT 'Unique identifier for public lookup',
  donation_id INT NOT NULL COMMENT 'Reference to the donation',
  session_id VARCHAR(100) COMMENT 'Browser session identifier',
  status ENUM('open', 'closed', 'archived') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  assigned_admin_id INT NULL COMMENT 'Admin assigned to handle the ticket',
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_donation_id (donation_id),
  INDEX idx_session_id (session_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS anonymous_ticket_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL COMMENT 'Reference to anonymous ticket',
  sender_type ENUM('user', 'admin') NOT NULL COMMENT 'Who sent the message',
  message TEXT NOT NULL COMMENT 'Message content',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (ticket_id) REFERENCES anonymous_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_type ENUM('donations', 'records', 'volunteers', 'workshops') NOT NULL,
  module_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 4. EVENTS TABLES
-- ============================================

CREATE TABLE events_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  imageUrl VARCHAR(500),
  hour VARCHAR(10),
  type ENUM('evento', 'noticia') DEFAULT 'evento'
);

-- ============================================
-- 5. VOLUNTEERS TABLES
-- ============================================

CREATE TABLE volunteer_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  imageUrl VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  skills TEXT,
  tools TEXT,
  hour VARCHAR(10) NOT NULL,
  spots INT NOT NULL
);

CREATE TABLE IF NOT EXISTS volunteer_option_proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  proposal TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  tools TEXT,
  hour VARCHAR(10) NULL,
  spots INT NULL,
  document_path VARCHAR(255),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vop_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE volunteers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  age VARCHAR(10),
  availability_days VARCHAR(255),
  availability_time_slots VARCHAR(255),
  interests TEXT,
  skills TEXT,
  motivation TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  volunteer_option_id INT,
  FOREIGN KEY (volunteer_option_id) REFERENCES volunteer_options(id)
);

CREATE TABLE IF NOT EXISTS volunteer_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  volunteer_option_id INT NOT NULL,
  status ENUM('registered', 'cancelled') DEFAULT 'registered',
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancellation_date DATETIME NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_vr_volunteer_option FOREIGN KEY (volunteer_option_id) REFERENCES volunteer_options(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_volunteer (user_id, volunteer_option_id),
  INDEX idx_user_id (user_id),
  INDEX idx_volunteer_option_id (volunteer_option_id),
  INDEX idx_status (status),
  INDEX idx_registration_date (registration_date)
);

-- ============================================
-- 6. WORKSHOPS TABLES
-- ============================================

CREATE TABLE workshops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255),
    descripcion TEXT, 
    imagen VARCHAR(255),
    materials TEXT,
    aprender TEXT,
    fecha VARCHAR(50) NOT NULL,
    hora VARCHAR(10) NOT NULL,
    capacidad INT
);

CREATE TABLE IF NOT EXISTS workshop_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  workshop_id INT NOT NULL,
  status ENUM('enrolled', 'cancelled') DEFAULT 'enrolled',
  enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancellation_date DATETIME NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_we_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_we_workshop FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_workshop (user_id, workshop_id),
  INDEX idx_user_id (user_id),
  INDEX idx_workshop_id (workshop_id),
  INDEX idx_status (status),
  INDEX idx_enrollment_date (enrollment_date)
);

-- ============================================
-- 7. ATTENDANCE TABLES
-- ============================================

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  cedula VARCHAR(50) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_tracks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
  scanning_active BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_tracks_date ON activity_tracks(event_date);
CREATE INDEX idx_activity_tracks_status ON activity_tracks(status);
CREATE INDEX idx_activity_tracks_created_by ON activity_tracks(created_by);

CREATE TABLE attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_track_id INT NOT NULL,
  record_id INT NULL,
  attendance_type ENUM('beneficiario', 'guest') NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  cedula VARCHAR(50) NULL,
  phone VARCHAR(20) NULL,
  attendance_method ENUM('qr_scan', 'manual_form') NOT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_track_id) REFERENCES activity_tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_beneficiario_attendance (activity_track_id, record_id, attendance_type),
  UNIQUE KEY unique_guest_attendance (activity_track_id, full_name, cedula, attendance_type)
);

CREATE INDEX idx_attendance_records_activity_track ON attendance_records(activity_track_id);
CREATE INDEX idx_attendance_records_record_id ON attendance_records(record_id);
CREATE INDEX idx_attendance_records_type ON attendance_records(attendance_type);
CREATE INDEX idx_attendance_records_created_by ON attendance_records(created_by);
CREATE INDEX idx_attendance_records_scanned_at ON attendance_records(scanned_at);

-- ============================================
-- 8. LANDING TABLES
-- ============================================

CREATE TABLE hero_section (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    URL_imagen NVARCHAR(255),
    descripcion TEXT NOT NULL,
    texto_boton_izquierdo VARCHAR(100) NOT NULL,
    color_boton_izquierdo VARCHAR(20) NOT NULL,
    texto_boton_derecho VARCHAR(100) NOT NULL,
    color_boton_derecho VARCHAR(20) NOT NULL
);

CREATE TABLE AboutSection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  URL_imagen VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  texto_boton VARCHAR(100) NOT NULL,
  color_boton VARCHAR(20) NOT NULL
);

CREATE TABLE landing_donaciones_component (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,       
  descripcion TEXT NOT NULL  
);

CREATE TABLE landing_donaciones_card (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo_card VARCHAR(100) NOT NULL,  
  descripcion_card VARCHAR(255),    
  URL_imagen NVARCHAR(255) NULL,
  texto_boton VARCHAR(100) NOT NULL,
  color_boton VARCHAR(20) NOT NULL
);

CREATE TABLE landing_Volunteer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR (255) NOT NULL,
  descripcion VARCHAR (255) NOT NULL,
  URL_imagen VARCHAR (255) NOT NULL,
  subtitulo VARCHAR (255) NOT NULL,
  texto_boton VARCHAR(100) NOT NULL,
  color_boton VARCHAR(20) NOT NULL
);

-- Landing indexes
CREATE INDEX idx_titulo_card ON landing_donaciones_card (titulo_card);
CREATE INDEX idx_descripcion_card ON landing_donaciones_card (descripcion_card(255));
CREATE INDEX idx_titulo_component ON landing_donaciones_component (titulo);
CREATE INDEX idx_descripcion_component ON landing_donaciones_component (descripcion(255));
CREATE INDEX idx_titulo_about ON AboutSection (titulo);
CREATE INDEX idx_descripcion_about ON AboutSection (descripcion(255));
CREATE INDEX idx_titulo_volunteer ON landing_Volunteer (titulo);
CREATE INDEX idx_subtitulo_volunteer ON landing_Volunteer (subtitulo);
CREATE INDEX idx_descripcion_volunteer ON landing_Volunteer (descripcion(255));
CREATE INDEX idx_titulo_hero ON hero_section (titulo);
CREATE INDEX idx_descripcion_hero ON hero_section (descripcion(255));

-- ============================================
-- 9. GOOGLE DRIVE TABLES
-- ============================================

CREATE TABLE google_drive_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NULL,
    expiry_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_google_drive_tokens_created_at ON google_drive_tokens(created_at);

-- ============================================
-- IMPORT COMPLETE!
-- ============================================

