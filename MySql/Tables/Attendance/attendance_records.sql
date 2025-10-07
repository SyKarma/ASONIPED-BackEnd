-- Attendance Records Table
-- This table stores individual attendance records for both beneficiarios and guests
CREATE TABLE attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_track_id INT NOT NULL,
  record_id INT NULL, -- For beneficiarios (links to records table), NULL for guests
  attendance_type ENUM('beneficiario', 'guest') NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  cedula VARCHAR(50) NULL, -- Optional for guests, can be NULL
  phone VARCHAR(20) NULL, -- Optional for guests, can be NULL
  attendance_method ENUM('qr_scan', 'manual_form') NOT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (activity_track_id) REFERENCES activity_tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate attendance for the same person in the same activity
  -- For beneficiarios: prevent same record_id in same activity_track
  -- For guests: prevent same full_name + cedula combination in same activity_track
  UNIQUE KEY unique_beneficiario_attendance (activity_track_id, record_id, attendance_type),
  UNIQUE KEY unique_guest_attendance (activity_track_id, full_name, cedula, attendance_type)
);

-- Indexes for better performance
CREATE INDEX idx_attendance_records_activity_track ON attendance_records(activity_track_id);
CREATE INDEX idx_attendance_records_record_id ON attendance_records(record_id);
CREATE INDEX idx_attendance_records_type ON attendance_records(attendance_type);
CREATE INDEX idx_attendance_records_created_by ON attendance_records(created_by);
CREATE INDEX idx_attendance_records_scanned_at ON attendance_records(scanned_at);
