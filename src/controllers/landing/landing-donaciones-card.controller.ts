import { Request, Response } from 'express';
import { LandingDonacionesCardModel } from '../../models/landing/landing-donaciones-card.model';

// Listar todas las cards
export const getAllLandingDonacionesCards = async (req: Request, res: Response) => {
  try {
    const cards = await LandingDonacionesCardModel.getAll();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cards' });
  }
};

// Obtener card por ID
export const getLandingDonacionesCardById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const card = await LandingDonacionesCardModel.getById(id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching card' });
  }
};

// Crear card (con imagen opcional)
export const createLandingDonacionesCard = async (req: Request, res: Response) => {
  const { titulo_card, descripcion_card, texto_boton, color_boton } = req.body;
  let URL_imagen = "";

  // Si se subió imagen, guarda la ruta
  if (req.file) {
    URL_imagen = `/uploads/${req.file.filename}`;
  }

  // Validaciones básicas
  if (!titulo_card || typeof titulo_card !== "string" || titulo_card.length < 3 || titulo_card.length > 100) {
    return res.status(400).json({ error: "titulo_card es requerido y debe tener entre 3 y 100 caracteres" });
  }
  if (!descripcion_card || typeof descripcion_card !== "string" || descripcion_card.length > 100) {
    return res.status(400).json({ error: "descripcion_card es requerida y máximo 100 caracteres" });
  }
  if (!texto_boton || typeof texto_boton !== "string" || texto_boton.length < 1 || texto_boton.length > 100) {
    return res.status(400).json({ error: "texto_boton es requerido y debe tener entre 1 y 100 caracteres" });
  }
  if (!color_boton || typeof color_boton !== "string" || color_boton.length > 20) {
    return res.status(400).json({ error: "color_boton es requerido y máximo 20 caracteres" });
  }

  try {
    const id = await LandingDonacionesCardModel.create({
      titulo_card,
      descripcion_card,
      URL_imagen,
      texto_boton,
      color_boton
    });
    res.status(201).json({ message: 'Card created', id, URL_imagen });
  } catch (err) {
    res.status(500).json({ error: 'Error creating card' });
  }
};

// Actualizar card (imagen opcional)
export const updateLandingDonacionesCard = async (req: Request, res: Response) => {
  const { titulo_card, descripcion_card, texto_boton, color_boton } = req.body;
  let URL_imagen = "";

  if (req.file) {
    URL_imagen = `/uploads/${req.file.filename}`;
  } else if (req.body.URL_imagen) {
    URL_imagen = req.body.URL_imagen;
  }

  if (!titulo_card || typeof titulo_card !== "string" || titulo_card.length < 3 || titulo_card.length > 100) {
    return res.status(400).json({ error: "titulo_card es requerido y debe tener entre 3 y 100 caracteres" });
  }
  if (!descripcion_card || typeof descripcion_card !== "string" || descripcion_card.length > 100) {
    return res.status(400).json({ error: "descripcion_card es requerida y máximo 100 caracteres" });
  }
  if (!texto_boton || typeof texto_boton !== "string" || texto_boton.length < 1 || texto_boton.length > 100) {
    return res.status(400).json({ error: "texto_boton es requerido y debe tener entre 1 y 100 caracteres" });
  }
  if (!color_boton || typeof color_boton !== "string" || color_boton.length > 20) {
    return res.status(400).json({ error: "color_boton es requerido y máximo 20 caracteres" });
  }

  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesCardModel.update(id, {
      titulo_card,
      descripcion_card,
      URL_imagen,
      texto_boton,
      color_boton
    });
    res.json({ message: 'Card updated', URL_imagen });
  } catch (err) {
    res.status(500).json({ error: 'Error updating card' });
  }
};

// Eliminar card
export const deleteLandingDonacionesCard = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesCardModel.delete(id);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting card' });
  }
};