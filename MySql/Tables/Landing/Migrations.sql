-- Índices para búsqueda rápida en tablas de la landing

-- Donaciones Card
CREATE INDEX idx_titulo_card ON landing_donaciones_card (titulo_card);
CREATE INDEX idx_descripcion_card ON landing_donaciones_card (descripcion_card(255));

-- Donaciones Component
CREATE INDEX idx_titulo_component ON landing_donaciones_component (titulo);
CREATE INDEX idx_descripcion_component ON landing_donaciones_component (descripcion(255));

-- About Section
CREATE INDEX idx_titulo_about ON AboutSection (titulo);
CREATE INDEX idx_descripcion_about ON AboutSection (descripcion(255));

-- Volunteer Section
CREATE INDEX idx_titulo_volunteer ON landing_Volunteer (titulo);
CREATE INDEX idx_subtitulo_volunteer ON landing_Volunteer (subtitulo);
CREATE INDEX idx_descripcion_volunteer ON landing_Volunteer (descripcion(255));

-- Historias de vida (ejecutar una vez en BD existente)
CREATE TABLE IF NOT EXISTS landing_historias_component (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  color_titulo VARCHAR(20) NOT NULL DEFAULT '#ea580c'
);

CREATE TABLE IF NOT EXISTS landing_historias_item (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  historia TEXT NOT NULL,
  video_url VARCHAR(500) NULL,
  orden INT NOT NULL DEFAULT 0
);

-- Hero Section
CREATE INDEX idx_titulo_hero ON hero_section (titulo);
CREATE INDEX idx_descripcion_hero ON hero_section (descripcion(255));
