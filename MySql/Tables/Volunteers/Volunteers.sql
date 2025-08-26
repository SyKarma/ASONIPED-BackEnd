CREATE TABLE volunteers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  age VARCHAR(10),
  availability_days VARCHAR(255),
  availability_time_slots VARCHAR(255),
  interests TEXT,
  skills TEXT,
  motivation TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  volunteer_option_id INT,
  FOREIGN KEY (volunteer_option_id) REFERENCES volunteer_options(id)
);
