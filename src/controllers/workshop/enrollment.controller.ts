import { Request, Response } from 'express';
import { EnrollmentModel } from '../../models/workshop/enrollment.model';

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
export const getEnrollmentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const enrollment = await EnrollmentModel.getById(Number(id));
    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollment', error });
  }
};

// Create a new enrollment
export const createEnrollment = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, phone, notes, workshopId } = req.body;
  try {
    const newEnrollment = await EnrollmentModel.create({ fullName, email, phone, notes, workshopId });
    res.status(201).json(newEnrollment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating enrollment', error });
  }
};

// Update an enrollment
export const updateEnrollment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { fullName, email, phone, notes, workshopId } = req.body;
  try {
    const result = await EnrollmentModel.update(Number(id), { fullName, email, phone, notes, workshopId });
    if ((result as any).affectedRows === 0) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }
    res.json({ id, fullName, email, phone, notes, workshopId });
  } catch (error) {
    res.status(500).json({ message: 'Error updating enrollment', error });
  }
};

// Delete an enrollment
export const deleteEnrollment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await EnrollmentModel.delete(Number(id));
    if ((result as any).affectedRows === 0) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }
    res.json({ message: 'Enrollment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting enrollment', error});
  }
};