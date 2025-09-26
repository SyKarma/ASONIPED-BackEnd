CREATE TABLE records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('draft', 'pending', 'needs_modification', 'approved', 'rejected', 'active', 'inactive') DEFAULT 'draft',
  phase ENUM('phase1', 'phase2', 'phase3', 'phase4', 'completed') DEFAULT 'phase1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES admins(id)
);
