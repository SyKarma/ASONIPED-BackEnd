import { db } from '../../db';
// Define la interfaz para HeroSection
export interface HeroSection {
  id?: number;
  titulo: string;
  URL_imagen?: string;
  descripcion: string;
  texto_boton_izquierdo: string;
  color_boton_izquierdo?: string;
  texto_boton_derecho: string;
  color_boton_derecho?: string;
}
// Modelo para interactuar con la tabla hero_section
export const HeroSectionModel = {
  async getAll(): Promise<HeroSection[]> {
    const [rows] = await db.query('SELECT * FROM hero_section ORDER BY id DESC');
    return rows as HeroSection[];
  },
// Obtiene una sección hero por ID
  async getById(id: number): Promise<HeroSection | null> {
    const [rows] = await db.query('SELECT * FROM hero_section WHERE id = ?', [id]);
    return (rows as HeroSection[])[0] || null;
  },
// Crea una nueva sección hero
  async create(section: HeroSection): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO hero_section (titulo, URL_imagen, descripcion, texto_boton_izquierdo, color_boton_izquierdo, texto_boton_derecho, color_boton_derecho) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        section.titulo,
        section.URL_imagen,
        section.descripcion,
        section.texto_boton_izquierdo,
        section.color_boton_izquierdo || 'orange',
        section.texto_boton_derecho,
        section.color_boton_derecho || 'blue'
      ]
    );
    return (result as any).insertId;
  },
// Actualiza una sección hero existente
  async update(id: number, section: Partial<HeroSection>): Promise<void> {
    const fields = Object.keys(section).map(key => `${key} = ?`).join(', ');
    const values = Object.values(section);
    await db.query(`UPDATE hero_section SET ${fields} WHERE id = ?`, [...values, id]);
  },
// Elimina una sección hero por ID
  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM hero_section WHERE id = ?', [id]);
  }
};

// about us model
export interface AboutSection {
  id?: number;
  titulo: string;
  URL_imagen?: string;
  descripcion: string;
  texto_boton: string;
  color_boton?: string;
}

export const AboutSectionModel = {
  async getAll(): Promise<AboutSection[]> {
    const [rows] = await db.query('SELECT * FROM AboutSection ORDER BY id DESC');
    return rows as AboutSection[];
  },

  async getById(id: number): Promise<AboutSection | null> {
    const [rows] = await db.query('SELECT * FROM AboutSection WHERE id = ?', [id]);
    return (rows as AboutSection[])[0] || null;
  },

  async create(section: AboutSection): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO AboutSection (titulo, URL_imagen, descripcion, texto_boton, color_boton) VALUES (?, ?, ?, ?, ?)',
      [
        section.titulo,
        section.URL_imagen,
        section.descripcion,
        section.texto_boton,
        section.color_boton || 'blue',
      ]
    );
    return (result as any).insertId;
  },

  async update(id: number, section: Partial<AboutSection>): Promise<void> {
    const fields = Object.keys(section).map(key => `${key} = ?`).join(', ');
    const values = Object.values(section);
    await db.query(`UPDATE AboutSection SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM AboutSection WHERE id = ?', [id]);
  }
};

// section donaciones model
export interface LandingDonacionesComponent {
  id?: number;
  titulo: string;
  descripcion: string;
}

export const LandingDonacionesComponentModel = {
  async getAll(): Promise<LandingDonacionesComponent[]> {
    const [rows] = await db.query('SELECT * FROM landing_donaciones_component ORDER BY id DESC');
    return rows as LandingDonacionesComponent[];
  },

  async getById(id: number): Promise<LandingDonacionesComponent | null> {
    const [rows] = await db.query('SELECT * FROM landing_donaciones_component WHERE id = ?', [id]);
    return (rows as LandingDonacionesComponent[])[0] || null;
  },

  async create(component: LandingDonacionesComponent): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO landing_donaciones_component (titulo, descripcion) VALUES (?, ?)',
      [component.titulo, component.descripcion]
    );
    return (result as any).insertId;
  },

  async update(id: number, component: Partial<LandingDonacionesComponent>): Promise<void> {
    const fields = Object.keys(component).map(key => `${key} = ?`).join(', ');
    const values = Object.values(component);
    await db.query(`UPDATE landing_donaciones_component SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM landing_donaciones_component WHERE id = ?', [id]);
  }
};
// landin donaciones cards

export interface LandingDonacionesCard {
  id?: number;
  titulo_card: string;
  descripcion_card: string;
  URL_imagen?: string;
  texto_boton: string;
  color_boton?: string;
}

export const LandingDonacionesCardModel = {
  async getAll(): Promise<LandingDonacionesCard[]> {
    const [rows] = await db.query('SELECT * FROM landing_donaciones_card ORDER BY id DESC');
    return rows as LandingDonacionesCard[];
  },

  async getById(id: number): Promise<LandingDonacionesCard | null> {
    const [rows] = await db.query('SELECT * FROM landing_donaciones_card WHERE id = ?', [id]);
    return (rows as LandingDonacionesCard[])[0] || null;
  },

  async create(card: LandingDonacionesCard): Promise<number> {
    const [result] = await db.query(
      'INSERT INTO landing_donaciones_card (titulo_card, descripcion_card, URL_imagen, texto_boton, color_boton) VALUES (?, ?, ?, ?, ?)',
      [
        card.titulo_card,
        card.descripcion_card,
        card.URL_imagen,
        card.texto_boton,
        card.color_boton || 'ORANGE',
      ]
    );
    return (result as any).insertId;
  },

  async update(id: number, card: Partial<LandingDonacionesCard>): Promise<void> {
    const fields = Object.keys(card).map(key => `${key} = ?`).join(', ');
    const values = Object.values(card);
    await db.query(`UPDATE landing_donaciones_card SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM landing_donaciones_card WHERE id = ?', [id]);
  }
};