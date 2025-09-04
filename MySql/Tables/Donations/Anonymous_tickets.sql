-- Anonymous Tickets Table
-- This table stores tickets created by non-registered users

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
  
  -- Indexes for performance
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_donation_id (donation_id),
  INDEX idx_session_id (session_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  -- Foreign key constraints
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anonymous Ticket Messages Table
-- This table stores messages for anonymous tickets

CREATE TABLE IF NOT EXISTS anonymous_ticket_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL COMMENT 'Reference to anonymous ticket',
  sender_type ENUM('user', 'admin') NOT NULL COMMENT 'Who sent the message',
  message TEXT NOT NULL COMMENT 'Message content',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_timestamp (timestamp),
  
  -- Foreign key constraint
  FOREIGN KEY (ticket_id) REFERENCES anonymous_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



