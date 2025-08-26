CREATE TABLE record_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  note TEXT NOT NULL,
  type ENUM('note', 'activity', 'milestone') DEFAULT 'note',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES admins(id)
);