CREATE TABLE socioeconomic_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  housing_type ENUM('casa_propia', 'alquilada', 'prestada'),
  available_services JSON,
  family_income ENUM('menos_200k', '200k_400k', '200k_600k', '200k_800k', '200k_1000k', '1000k_1300k', 'mas_1300k'),
  working_family_members JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);