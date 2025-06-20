import { Request, Response } from 'express';
import { EnrollmentModel } from '../../models/workshop/enrollment.model';
import { WorkshopModel, Workshop } from '../../models/workshop/workshop.model';

// Workshop Controllers
export const getAllWorkshops = async (req: Request, res: Response) => {
  try {
    const workshops = await WorkshopModel.getAll();
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshops', error });
  }
};

export const getWorkshopById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const workshop = await WorkshopModel.getById(id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshop', error });
  }
};

export const createWorkshop = async (req: Request, res: Response) => {
  const { title, description, imageUrl, objectives, materials, learnText } = req.body;
  try {
    const newWorkshop: Workshop = {
      id: Date.now().toString(),
      title,
      description,
      imageUrl,
      objectives,
      materials,
      learnText
    };
    const createdWorkshop = await WorkshopModel.create(newWorkshop);
    res.status(201).json(createdWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Error creating workshop', error });
  }
};

export const updateWorkshop = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, imageUrl, objectives, materials, learnText } = req.body;
  try {
    const updatedWorkshop = await WorkshopModel.update(id, {
      title,
      description,
      imageUrl,
      objectives,
      materials,
      learnText
    });
    if (!updatedWorkshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json(updatedWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Error updating workshop', error });
  }
};

export const deleteWorkshop = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const success = await WorkshopModel.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json({ message: 'Workshop deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workshop', error });
  }
};

// Enrollment Controllers
// Get all enrollments
export const getAllEnrollments = async (req: Request, res: Response) => {
  try {
    const enrollments = await EnrollmentModel.getAll();
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollments', error });
  }
};

// Get enrollments for a specific workshop
export const getEnrollmentsByWorkshop = async (req: Request, res: Response) => {
  const { workshopId } = req.params;
  try {
    const enrollments = await EnrollmentModel.getByWorkshop(workshopId);
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollments', error });
  }
};

// Get a single enrollment by ID
export const getEnrollmentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const enrollment = await EnrollmentModel.getById(Number(id));
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollment', error });
  }
};

// Create a new enrollment
export const createEnrollment = async (req: Request, res: Response) => {
  const { fullName, email, phone, notes, workshopId } = req.body;
  try {
    const newEnrollment = await EnrollmentModel.create({ fullName, email, phone, notes, workshopId });
    res.status(201).json(newEnrollment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating enrollment', error });
  }
};

// Update an enrollment
export const updateEnrollment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fullName, email, phone, notes, workshopId } = req.body;
  try {
    const result = await EnrollmentModel.update(Number(id), { fullName, email, phone, notes, workshopId });
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json({ id, fullName, email, phone, notes, workshopId });
  } catch (error) {
    res.status(500).json({ message: 'Error updating enrollment', error });
  }
};

// Delete an enrollment
export const deleteEnrollment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await EnrollmentModel.delete(Number(id));
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json({ message: 'Enrollment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting enrollment', error });
  }
};