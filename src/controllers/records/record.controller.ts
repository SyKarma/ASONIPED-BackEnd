import { Request, Response } from 'express';
import * as RecordModel from '../../models/records/record.model';
import * as PersonalDataModel from '../../models/records/personal_data.model';

// Crear nuevo expediente
export const createRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personal_data, ...recordData } = req.body;
    
    // Crear el expediente principal
    const recordId = await RecordModel.createRecord({
      ...recordData,
      created_by: (req as any).user?.id
    });
    
    // Si se proporcionan datos personales, crearlos
    if (personal_data) {
      await PersonalDataModel.createPersonalData({
        ...personal_data,
        record_id: recordId
      });
    }
    
    res.status(201).json({ 
      message: 'Expediente creado exitosamente',
      record_id: recordId
    });
  } catch (err) {
    console.error('Error creating record:', err);
    res.status(500).json({ 
      error: 'Error creando expediente',
      details: err.message || err
    });
  }
};

// Obtener expediente por ID
export const getRecordById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const record = await RecordModel.getRecordWithDetails(id);
    
    if (!record) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }
    
    res.json(record);
  } catch (err) {
    console.error('Error getting record:', err);
    res.status(500).json({ error: 'Error obteniendo expediente' });
  }
};

// Obtener todos los expedientes con filtros
export const getRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    
    const { records, total } = await RecordModel.getRecords(page, limit, status, search);
    
    res.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error getting records:', err);
    res.status(500).json({ error: 'Error obteniendo expedientes' });
  }
};

// Actualizar expediente
export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { personal_data, ...recordData } = req.body;
    
    // Actualizar expediente principal
    await RecordModel.updateRecord(id, recordData);
    
    // Actualizar datos personales si se proporcionan
    if (personal_data) {
      const existingPersonalData = await PersonalDataModel.getPersonalDataByRecordId(id);
      
      if (existingPersonalData) {
        await PersonalDataModel.updatePersonalData(id, personal_data);
      } else {
        await PersonalDataModel.createPersonalData({
          ...personal_data,
          record_id: id
        });
      }
    }
    
    res.json({ message: 'Expediente actualizado exitosamente' });
  } catch (err) {
    console.error('Error updating record:', err);
    res.status(500).json({ error: 'Error actualizando expediente' });
  }
};

// Eliminar expediente
export const deleteRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await RecordModel.deleteRecord(id);
    
    res.json({ message: 'Expediente eliminado exitosamente' });
  } catch (err) {
    console.error('Error deleting record:', err);
    res.status(500).json({ error: 'Error eliminando expediente' });
  }
};

// Cambiar estado del expediente
export const updateRecordStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['draft', 'pending', 'approved', 'rejected', 'active', 'inactive'].includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }
    
    await RecordModel.updateRecordStatus(id, status);
    
    res.json({ message: 'Estado del expediente actualizado exitosamente' });
  } catch (err) {
    console.error('Error updating record status:', err);
    res.status(500).json({ error: 'Error actualizando estado del expediente' });
  }
};

// Obtener estadísticas de expedientes
export const getRecordStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await RecordModel.getRecordStats();
    res.json(stats);
  } catch (err) {
    console.error('Error getting record stats:', err);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

// Buscar expediente por cédula
export const searchRecordByCedula = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula } = req.params;
    
    const personalData = await PersonalDataModel.searchByCedula(cedula);
    
    if (!personalData) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }
    
    const record = await RecordModel.getRecordWithDetails(personalData.record_id);
    
    res.json(record);
  } catch (err) {
    console.error('Error searching record by cedula:', err);
    res.status(500).json({ error: 'Error buscando expediente' });
  }
};

// Verificar si una cédula existe
export const checkCedulaExists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula } = req.params;
    const excludeRecordId = req.query.excludeRecordId ? parseInt(req.query.excludeRecordId as string) : undefined;
    
    const exists = await PersonalDataModel.checkCedulaExists(cedula, excludeRecordId);
    
    res.json({ exists });
  } catch (err) {
    console.error('Error checking cedula:', err);
    res.status(500).json({ error: 'Error verificando cédula' });
  }
}; 