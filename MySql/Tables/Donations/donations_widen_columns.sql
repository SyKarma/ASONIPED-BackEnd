-- Run once on existing databases if POST /donations returns 500 on long emails/names.
-- Error in MySQL logs: Data too long for column 'correo' at row 1

ALTER TABLE donations
  MODIFY COLUMN nombre VARCHAR(150) NULL,
  MODIFY COLUMN correo VARCHAR(255) NULL,
  MODIFY COLUMN telefono VARCHAR(20) NULL;
