-- Estructura de la tabla hero_section

CREATE TABLE hero_section (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    URL_imagen NVARCHAR(255),
    descripcion TEXT NOT NULL,
    texto_boton_izquierdo VARCHAR(100) NOT NULL,
    color_boton_izquierdo VARCHAR(20) NOT NULL,
    texto_boton_derecho VARCHAR(100) NOT NULL,
    color_boton_derecho VARCHAR(20) NOT NULL
);

-- Estructura de la tabla AboutSection

CREATE TABLE AboutSection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  URL_imagen VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  texto_boton VARCHAR(100) NOT NULL,
  color_boton VARCHAR(20) NOT NULL
);

-- Estructura de la tabla landing_donaciones_component

CREATE TABLE landing_donaciones_component (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,       
  descripcion TEXT NOT NULL  

);

-- Estructura de la tabla landing_donaciones_card

CREATE TABLE landing_donaciones_card (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo_card VARCHAR(100) NOT NULL,  
  descripcion_card VARCHAR(250) NOT NULL,    
  URL_imagen NVARCHAR(255) NULL,
  texto_boton VARCHAR(100) NOT NULL,
  color_boton VARCHAR(20) NOT NULL|
  
);

-- Estructura de la tabla landing_Volunteer

CREATE TABLE landing_Volunteer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR (255) NOT NULL,
  descripcion VARCHAR (255) NOT NULL,
  URL_imagen VARCHAR (255) NOT NULL,
  subtitulo VARCHAR (255) NOT NULL,
  texto_boton VARCHAR(100) NOT NULL,
  color_boton VARCHAR(20) NOT NULL
);