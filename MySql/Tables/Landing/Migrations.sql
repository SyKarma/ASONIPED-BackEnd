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

-- Hero Section
CREATE INDEX idx_titulo_hero ON hero_section (titulo);
CREATE INDEX idx_descripcion_hero ON hero_section (descripcion(255));
