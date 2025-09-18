CREATE TABLE volunteer_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  imageUrl VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL
);

-- New: Proposals table for volunteer options
CREATE TABLE IF NOT EXISTS volunteer_option_proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  proposal TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  tools TEXT,
  document_path VARCHAR(255),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vop_user FOREIGN KEY (user_id) REFERENCES users(id)
);