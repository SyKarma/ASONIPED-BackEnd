CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL,
  correo VARCHAR(30) NOT NULL,
  telefono VARCHAR(9) NOT NULL, -- formato "8888-8888"
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  aceptacion_privacidad BOOLEAN NOT NULL,
  aceptacion_comunicacion BOOLEAN NOT NULL
);
