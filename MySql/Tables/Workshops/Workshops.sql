CREATE TABLE workshops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255),
    descripcion TEXT, 
    imagen VARCHAR(255),
    materials TEXT,
    aprender TEXT,
    fecha DATE,
    hora TIME,
    capacidad INT
);

