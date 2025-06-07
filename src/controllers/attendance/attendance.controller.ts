import { Request, Response } from 'express';
import {
  getAllAttendance,
  createAttendance,
  Attendance
} from '../../models/attendance/attendance.model';

// Conseguir todos los registros de asistencia
// Este controlador obtiene todos los registros de asistencia de la base de datos
export const getAllAttendanceController = async (req: Request, res: Response) => {
  try {
    const records = await getAllAttendance();
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance records.' });
  }
};

// Creacion de un nuevo registro de asistencia
export const createAttendanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, cedula, tipo } = req.body;
    if (!nombre || !cedula || !tipo) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    await createAttendance({ nombre, cedula, tipo });
    res.status(201).json({ message: 'Attendance recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Error recording attendance.' });
  }
};