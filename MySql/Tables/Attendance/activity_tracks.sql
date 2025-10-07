-- Activity Tracks Table
-- This table stores information about different activities/events for attendance tracking
CREATE TABLE activity_tracks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
  scanning_active BOOLEAN DEFAULT FALSE, -- Indicates if QR scanning is currently active for this activity
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for better performance on common queries
CREATE INDEX idx_activity_tracks_date ON activity_tracks(event_date);
CREATE INDEX idx_activity_tracks_status ON activity_tracks(status);
CREATE INDEX idx_activity_tracks_created_by ON activity_tracks(created_by);
