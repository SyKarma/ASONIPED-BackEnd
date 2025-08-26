CREATE TABLE socioeconomic_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  full_name VARCHAR(255),
  age INT,
  birth_date DATE,
  origin_place VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  family_nucleus JSON,
  responsible_person JSON,
  working_people JSON,
  housing_type ENUM('casa_propia', 'alquilada', 'prestada'),
  services JSON,
  family_income ENUM('menos_200k', '200k_400k', '400k_600k', '600k_800k', '800k_1000k', '1000k_1300k', 'mas_1300k'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);