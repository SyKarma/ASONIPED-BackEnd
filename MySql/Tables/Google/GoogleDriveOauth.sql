CREATE TABLE google_drive_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NULL,                    -- Changed from NOT NULL to NULL
    expiry_date DATETIME NULL,                  -- Changed from NOT NULL to NULL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add an index for better performance
CREATE INDEX idx_google_drive_tokens_created_at ON google_drive_tokens(created_at);