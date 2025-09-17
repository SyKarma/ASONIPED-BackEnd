-- Table for storing notes/comments on records
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
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Add index for better performance
CREATE INDEX idx_record_notes_record_id ON record_notes(record_id);
CREATE INDEX idx_record_notes_type ON record_notes(type);
CREATE INDEX idx_record_notes_created_at ON record_notes(created_at);
