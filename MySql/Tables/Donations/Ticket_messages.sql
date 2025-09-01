CREATE TABLE ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_type ENUM('donations', 'records', 'volunteers', 'workshops') NOT NULL,
  module_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
