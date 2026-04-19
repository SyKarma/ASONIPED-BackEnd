-- Parking registration for activities (public link + admin)
-- Run after base schema exists.

ALTER TABLE activity_tracks
  ADD COLUMN parking_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER scanning_active,
  ADD COLUMN parking_public_token VARCHAR(64) NULL DEFAULT NULL AFTER parking_enabled,
  ADD UNIQUE KEY uq_activity_tracks_parking_token (parking_public_token);

CREATE TABLE IF NOT EXISTS activity_parking_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_track_id INT NOT NULL,
  plate_raw VARCHAR(32) NOT NULL,
  plate_normalized VARCHAR(32) NOT NULL,
  full_name VARCHAR(255) NULL,
  cedula VARCHAR(50) NULL,
  phone VARCHAR(30) NULL,
  source ENUM('public_link', 'admin') NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_track_id) REFERENCES activity_tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_parking_activity_plate (activity_track_id, plate_normalized),
  INDEX idx_parking_activity (activity_track_id)
);
