CREATE TABLE workshops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255),
    descripcion TEXT, 
    imagen VARCHAR(255),
    materials TEXT,
    aprender TEXT,
    fecha VARCHAR(50) NOT NULL,  -- Changed to VARCHAR format (DD/MM/YYYY)
    hora VARCHAR(10) NOT NULL,    -- Changed to VARCHAR format (HH:MM)
    capacidad INT
);

