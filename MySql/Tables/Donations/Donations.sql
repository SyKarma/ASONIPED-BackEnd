CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NULL, -- Allow NULL for anonymous donations
  correo VARCHAR(255) NULL, -- Allow NULL for anonymous donations (real emails exceed 30 chars)
  telefono VARCHAR(20) NULL, -- Allow NULL for anonymous donations; digits-only or formatted
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  aceptacion_privacidad BOOLEAN NOT NULL,
  aceptacion_comunicacion BOOLEAN NOT NULL
);
