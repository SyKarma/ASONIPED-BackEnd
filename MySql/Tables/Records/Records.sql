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
  FOREIGN KEY (handed_over_by) REFERENCES admins(id),
  FOREIGN KEY (created_by) REFERENCES admins(id)
);
