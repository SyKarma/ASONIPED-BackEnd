CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NULL, -- Allow NULL for anonymous donations
  correo VARCHAR(30) NULL, -- Allow NULL for anonymous donations
  telefono VARCHAR(9) NULL, -- Allow NULL for anonymous donations, formato "8888-8888"
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  aceptacion_privacidad BOOLEAN NOT NULL,
  aceptacion_comunicacion BOOLEAN NOT NULL
);
