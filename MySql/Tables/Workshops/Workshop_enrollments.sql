-- Table to track workshop enrollments
CREATE TABLE IF NOT EXISTS workshop_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  workshop_id INT NOT NULL,
  status ENUM('enrolled', 'cancelled') DEFAULT 'enrolled',
  enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancellation_date DATETIME NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_we_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_we_workshop FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_workshop (user_id, workshop_id),
  INDEX idx_user_id (user_id),
  INDEX idx_workshop_id (workshop_id),
  INDEX idx_status (status),
  INDEX idx_enrollment_date (enrollment_date)
);

-- Stored procedure to get available spots for a workshop
DELIMITER //
CREATE PROCEDURE GetWorkshopAvailableSpots(IN workshop_id INT)
BEGIN
  DECLARE total_spots INT DEFAULT 0;
  DECLARE enrolled_count INT DEFAULT 0;
  DECLARE available_spots INT DEFAULT 0;
  
  -- Get total spots for the workshop
  SELECT capacidad INTO total_spots 
  FROM workshops 
  WHERE id = workshop_id;
  
  -- Get count of active enrollments
  SELECT COUNT(*) INTO enrolled_count 
  FROM workshop_enrollments 
  WHERE workshop_id = workshop_id 
    AND status = 'enrolled';
  
  -- Calculate available spots
  SET available_spots = total_spots - enrolled_count;
  
  -- Return the result
  SELECT available_spots as available_spots, total_spots as total_spots, enrolled_count as enrolled_count;
END //
DELIMITER ;

-- Stored procedure to enroll a user in a workshop
DELIMITER //
CREATE PROCEDURE EnrollInWorkshop(
  IN p_user_id INT,
  IN p_workshop_id INT,
  IN p_notes TEXT
)
BEGIN
  DECLARE available_spots INT DEFAULT 0;
  DECLARE total_spots INT DEFAULT 0;
  DECLARE enrolled_count INT DEFAULT 0;
  DECLARE existing_id INT DEFAULT NULL;
  DECLARE existing_status VARCHAR(20) DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Check if user has an existing enrollment (enrolled or cancelled)
  SELECT id, status INTO existing_id, existing_status
  FROM workshop_enrollments 
  WHERE user_id = p_user_id 
    AND workshop_id = p_workshop_id;
  
  -- If user is already enrolled, throw error
  IF existing_status = 'enrolled' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User is already enrolled in this workshop';
  END IF;
  
  -- Get total spots and current enrollments
  SELECT capacidad INTO total_spots 
  FROM workshops 
  WHERE id = p_workshop_id;
  
  SELECT COUNT(*) INTO enrolled_count 
  FROM workshop_enrollments 
  WHERE workshop_id = p_workshop_id 
    AND status = 'enrolled';
  
  SET available_spots = total_spots - enrolled_count;
  
  -- Check if there are available spots
  IF available_spots <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No available spots for this workshop';
  END IF;
  
  -- If user has a cancelled enrollment, update it to enrolled
  IF existing_status = 'cancelled' THEN
    UPDATE workshop_enrollments 
    SET status = 'enrolled', 
        enrollment_date = NOW(), 
        cancellation_date = NULL, 
        notes = p_notes
    WHERE id = existing_id;
  ELSE
    -- Create new enrollment
    INSERT INTO workshop_enrollments (user_id, workshop_id, notes)
    VALUES (p_user_id, p_workshop_id, p_notes);
  END IF;
  
  COMMIT;
  
  -- Return success
  SELECT 'Enrollment successful' as message, available_spots - 1 as remaining_spots;
END //
DELIMITER ;

-- Stored procedure to cancel a workshop enrollment
DELIMITER //
CREATE PROCEDURE CancelWorkshopEnrollment(
  IN p_user_id INT,
  IN p_workshop_id INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Check if user is enrolled
  IF NOT EXISTS (
    SELECT 1 FROM workshop_enrollments 
    WHERE user_id = p_user_id 
      AND workshop_id = p_workshop_id 
      AND status = 'enrolled'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User is not enrolled in this workshop';
  END IF;
  
  -- Cancel the enrollment
  UPDATE workshop_enrollments 
  SET status = 'cancelled', cancellation_date = NOW()
  WHERE user_id = p_user_id 
    AND workshop_id = p_workshop_id 
    AND status = 'enrolled';
  
  COMMIT;
  
  -- Return success
  SELECT 'Enrollment cancelled successfully' as message;
END //
DELIMITER ;
