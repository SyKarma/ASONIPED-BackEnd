-- Table to track volunteer registrations for existing volunteer options
CREATE TABLE IF NOT EXISTS volunteer_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  volunteer_option_id INT NOT NULL,
  status ENUM('registered', 'cancelled') DEFAULT 'registered',
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancellation_date DATETIME NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_vr_volunteer_option FOREIGN KEY (volunteer_option_id) REFERENCES volunteer_options(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_volunteer (user_id, volunteer_option_id),
  INDEX idx_user_id (user_id),
  INDEX idx_volunteer_option_id (volunteer_option_id),
  INDEX idx_status (status),
  INDEX idx_registration_date (registration_date)
);

-- Stored procedure to get available spots for a volunteer option
DELIMITER //
CREATE PROCEDURE GetAvailableSpots(IN volunteer_option_id INT)
BEGIN
  DECLARE total_spots INT DEFAULT 0;
  DECLARE registered_count INT DEFAULT 0;
  DECLARE available_spots INT DEFAULT 0;
  
  -- Get total spots for the volunteer option
  SELECT spots INTO total_spots 
  FROM volunteer_options 
  WHERE id = volunteer_option_id;
  
  -- Get count of active registrations
  SELECT COUNT(*) INTO registered_count 
  FROM volunteer_registrations 
  WHERE volunteer_option_id = volunteer_option_id 
    AND status = 'registered';
  
  -- Calculate available spots
  SET available_spots = total_spots - registered_count;
  
  -- Return the result
  SELECT available_spots as available_spots, total_spots as total_spots, registered_count as registered_count;
END //
DELIMITER ;

-- Stored procedure to register a user for a volunteer option (with re-registration support)
DELIMITER //
CREATE PROCEDURE RegisterForVolunteer(
  IN p_user_id INT,
  IN p_volunteer_option_id INT,
  IN p_notes TEXT
)
BEGIN
  DECLARE available_spots INT DEFAULT 0;
  DECLARE total_spots INT DEFAULT 0;
  DECLARE registered_count INT DEFAULT 0;
  DECLARE existing_id INT DEFAULT NULL;
  DECLARE existing_status VARCHAR(20) DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Check if user has an existing registration (registered or cancelled)
  SELECT id, status INTO existing_id, existing_status
  FROM volunteer_registrations 
  WHERE user_id = p_user_id 
    AND volunteer_option_id = p_volunteer_option_id;
  
  -- If user is already registered, throw error
  IF existing_status = 'registered' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User is already registered for this volunteer option';
  END IF;
  
  -- Get total spots and current registrations
  SELECT spots INTO total_spots 
  FROM volunteer_options 
  WHERE id = p_volunteer_option_id;
  
  SELECT COUNT(*) INTO registered_count 
  FROM volunteer_registrations 
  WHERE volunteer_option_id = p_volunteer_option_id 
    AND status = 'registered';
  
  SET available_spots = total_spots - registered_count;
  
  -- Check if there are available spots
  IF available_spots <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No available spots for this volunteer option';
  END IF;
  
  -- If user has a cancelled registration, update it to registered
  IF existing_status = 'cancelled' THEN
    UPDATE volunteer_registrations 
    SET status = 'registered', 
        registration_date = NOW(), 
        cancellation_date = NULL, 
        notes = p_notes
    WHERE id = existing_id;
  ELSE
    -- Create new registration
    INSERT INTO volunteer_registrations (user_id, volunteer_option_id, notes)
    VALUES (p_user_id, p_volunteer_option_id, p_notes);
  END IF;
  
  COMMIT;
  
  -- Return success
  SELECT 'Registration successful' as message, available_spots - 1 as remaining_spots;
END //
DELIMITER ;

-- Stored procedure to cancel a volunteer registration
DELIMITER //
CREATE PROCEDURE CancelVolunteerRegistration(
  IN p_user_id INT,
  IN p_volunteer_option_id INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Check if user is registered
  IF NOT EXISTS (
    SELECT 1 FROM volunteer_registrations 
    WHERE user_id = p_user_id 
      AND volunteer_option_id = p_volunteer_option_id 
      AND status = 'registered'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User is not registered for this volunteer option';
  END IF;
  
  -- Cancel the registration
  UPDATE volunteer_registrations 
  SET status = 'cancelled', cancellation_date = NOW()
  WHERE user_id = p_user_id 
    AND volunteer_option_id = p_volunteer_option_id 
    AND status = 'registered';
  
  COMMIT;
  
  -- Return success
  SELECT 'Registration cancelled successfully' as message;
END //
DELIMITER ;
