import { Request, Response } from 'express';
import * as RecordModel from '../../models/records/record.model';
import * as PersonalDataModel from '../../models/records/personal_data.model';
import { db } from '../../db';

// Crear nuevo expediente
export const createRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREANDO EXPEDIENTE ===');
    console.log('req.user:', (req as any).user);
    console.log('req.body:', req.body);
    console.log('req.headers:', req.headers);
    
    const { personal_data, ...recordData } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    console.log('User ID para crear expediente:', userId);
    console.log('Datos personales:', personal_data);
    console.log('Record data:', recordData);
    
    if (!userId) {
      console.log('ERROR: No hay user ID');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    
    // Crear el expediente principal
    console.log('Llamando a RecordModel.createRecord con:', {
      ...recordData,
      created_by: userId
    });
    
    const recordId = await RecordModel.createRecord({
      ...recordData,
      status: 'pending', // Cambiar a pending cuando se envía
      created_by: userId
    });
    
    console.log('Expediente creado con ID:', recordId);
    
    // Si se proporcionan datos personales, crearlos
    if (personal_data) {
      console.log('Creando datos personales...');
      console.log('Datos personales a crear:', {
        ...personal_data,
        record_id: recordId
      });
      
      try {
        await PersonalDataModel.createPersonalData({
          ...personal_data,
          record_id: recordId
        });
        console.log('Datos personales creados exitosamente');
      } catch (personalDataError) {
        console.error('ERROR creando datos personales:', personalDataError);
        console.error('Error stack:', (personalDataError as Error).stack);
        throw personalDataError;
      }
    } else {
      console.log('No se proporcionaron datos personales');
    }
    
    console.log('=== EXPEDIENTE CREADO EXITOSAMENTE ===');
    res.status(201).json({ 
      message: 'Expediente creado exitosamente',
      record_id: recordId
    });
  } catch (err) {
    console.error('Error creating record:', err);
    console.error('Error stack:', (err as Error).stack);
    console.error('Error type:', typeof err);
    console.error('Error constructor:', err?.constructor?.name);
    res.status(500).json({ 
      error: 'Error creando expediente',
      details: (err as Error).message || String(err)
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
    const phase = req.query.phase as string | undefined;
    const search = req.query.search as string | undefined;
    
    const { records, total } = await RecordModel.getRecords(page, limit, status, phase, search);
    
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

// Completar expediente (Fase 3)
export const completeRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== COMPLETANDO EXPEDIENTE ===');
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'ID de expediente inválido' });
      return;
    }
    
    console.log('Record ID:', id);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    // Verificar que el expediente existe y está en fase 2
    const existingRecord = await RecordModel.getRecordById(id);
    if (!existingRecord) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }
    
    if (existingRecord.phase !== 'phase2') {
      res.status(400).json({ error: 'El expediente debe estar en Fase 2 para ser completado' });
      return;
    }
    
    // Procesar datos del formulario
    const formData = req.body.data ? JSON.parse(req.body.data) : req.body;
    console.log('Parsed form data:', formData);
    
    const {
      disability_information,
      socioeconomic_information,
      documentation_requirements
    } = formData;
    
    // Actualizar expediente a fase 3
    await RecordModel.updateRecord(id, {
      phase: 'phase3',
      status: 'pending'
    });
    
    // Crear/actualizar información de discapacidad
    if (disability_information) {
      await RecordModel.createOrUpdateDisabilityData(id, disability_information);
    }
    
    // Crear/actualizar requisitos de documentación
    if (documentation_requirements) {
      await RecordModel.createOrUpdateRegistrationRequirements(id, documentation_requirements);
    }
    
    // Crear/actualizar información socioeconómica
    if (socioeconomic_information) {
      await RecordModel.createOrUpdateSocioeconomicData(id, socioeconomic_information);
    }
    
         // Procesar documentos si existen
     if (req.files && Array.isArray(req.files)) {
       console.log('Procesando archivos subidos:', req.files.length);
       
       for (const file of req.files) {
        console.log('Procesando archivo:', file.originalname);
        const userId = (req as any).user?.userId || (req as any).user?.id;
        
                 // Mapear el nombre del campo del frontend al tipo de documento del backend
         const mapDocumentType = (fieldname: string, originalName: string): string => {
           console.log('Mapeando documento - fieldname:', fieldname, 'originalName:', originalName);
           
           // Mapeo directo por fieldname primero
           const fieldnameMapping: { [key: string]: string } = {
             'dictamen_medico': 'medical_diagnosis',
             'constancia_nacimiento': 'birth_certificate',
             'copia_cedula': 'cedula',
             'copias_cedulas_familia': 'cedula',
             'foto_pasaporte': 'photo',
             'constancia_pension_ccss': 'pension_certificate',
             'constancia_pension_alimentaria': 'pension_certificate',
             'constancia_estudio': 'study_certificate',
             'cuenta_banco_nacional': 'other'
           };
           
           // Si tenemos un fieldname específico, usarlo
           if (fieldname && fieldname !== 'documents' && fieldnameMapping[fieldname]) {
             console.log('Mapeo por fieldname:', fieldname, '->', fieldnameMapping[fieldname]);
             return fieldnameMapping[fieldname];
           }
           
           // Si el fieldname es genérico, intentar extraer el tipo del nombre del archivo
           if (fieldname === 'documents' || fieldname === '') {
             // Primero, verificar si el nombre del archivo ya incluye el tipo (formato: tipo_nombrearchivo.pdf)
             const fileNameParts = originalName.split('_');
             if (fileNameParts.length > 1) {
               const possibleType = fileNameParts[0];
               if (fieldnameMapping[possibleType]) {
                 console.log('Detectado tipo por prefijo en nombre:', possibleType, '->', fieldnameMapping[possibleType]);
                 return fieldnameMapping[possibleType];
               }
             }
             
             // Buscar patrones en el nombre del archivo
             const fileName = originalName.toLowerCase();
             
             // Patrones para identificar tipos de documentos
             if (fileName.includes('dictamen') || fileName.includes('medico') || fileName.includes('diagnostico') || fileName.includes('diagnóstico')) {
               console.log('Detectado como dictamen médico por nombre de archivo');
               return 'medical_diagnosis';
             }
             if (fileName.includes('nacimiento') || fileName.includes('birth') || fileName.includes('partida')) {
               console.log('Detectado como constancia de nacimiento por nombre de archivo');
               return 'birth_certificate';
             }
             if (fileName.includes('cedula') || fileName.includes('identificacion') || fileName.includes('identificación') || fileName.includes('dni') || fileName.includes('carnet')) {
               console.log('Detectado como cédula por nombre de archivo');
               return 'cedula';
             }
             if (fileName.includes('foto') || fileName.includes('photo') || fileName.includes('imagen') || fileName.includes('retrato')) {
               console.log('Detectado como foto por nombre de archivo');
               return 'photo';
             }
             if (fileName.includes('pension') || fileName.includes('ccss') || fileName.includes('pensión')) {
               console.log('Detectado como constancia de pensión por nombre de archivo');
               return 'pension_certificate';
             }
             if (fileName.includes('estudio') || fileName.includes('study') || fileName.includes('academico') || fileName.includes('académico')) {
               console.log('Detectado como constancia de estudio por nombre de archivo');
               return 'study_certificate';
             }
             if (fileName.includes('socioeconomica') || fileName.includes('socioeconómica') || fileName.includes('beca') || fileName.includes('solicitud')) {
               console.log('Detectado como formulario socioeconómico por nombre de archivo');
               return 'other';
             }
             
             // Intentar detectar por extensión y tamaño (heurística)
             if (fileName.endsWith('.pdf')) {
               // Si es un PDF pequeño, podría ser una cédula
               if (originalName.includes('cedula') || originalName.includes('identificacion')) {
                 console.log('Detectado como cédula por heurística');
                 return 'cedula';
               }
               // Si es un PDF con números, podría ser una orden o documento oficial
               if (/\d{4,}/.test(originalName)) {
                 console.log('Detectado como documento oficial por heurística (números)');
                 return 'other';
               }
             }
           }
           
           console.log('No se pudo mapear, usando tipo "other"');
           return 'other';
         };
        
        const documentType = mapDocumentType(file.fieldname || '', file.originalname || '');
        console.log('Mapeando documento:', { fieldname: file.fieldname, originalName: file.originalname, documentType });
        
        // Crear documento para cualquier usuario (no solo admin)
        await RecordModel.createDocument(id, {
          document_type: documentType,
          file_path: file.path || '',
          file_name: file.filename || '',
          file_size: file.size || 0,
          original_name: file.originalname || '',
          uploaded_by: userId
        });
        console.log('Documento creado exitosamente:', file.originalname, 'como tipo:', documentType);
      }
    } else {
      console.log('No se subieron archivos');
    }
    
    // Agregar nota de completación (solo si el usuario es admin)
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      // Verificar si el usuario existe en la tabla admins
      const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
      
      if (adminRows.length > 0) {
        await RecordModel.addNote(id, {
          note: 'Expediente completado - Fase 3',
          type: 'milestone',
          created_by: userId
        });
        console.log('Nota de completación agregada exitosamente');
      } else {
        console.log('Usuario no es admin, omitiendo nota de completación');
      }
    } catch (noteError) {
      console.error('Error agregando nota de completación:', noteError);
      // No fallar la operación si la nota falla
    }
    
    console.log('=== EXPEDIENTE COMPLETADO EXITOSAMENTE ===');
    res.json({ 
      message: 'Expediente completado exitosamente',
      record_id: id
    });
  } catch (err) {
    console.error('Error completing record:', err);
    res.status(500).json({ 
      error: 'Error completando expediente',
      details: (err as Error).message || String(err)
    });
  }
};

// Eliminar expediente
export const deleteRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'ID de expediente inválido' });
      return;
    }
    
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

// Obtener expediente del usuario actual
export const getMyRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    
    const record = await RecordModel.getUserRecord(userId);
    
    if (!record) {
      res.status(404).json({ error: 'No se encontró expediente para este usuario' });
      return;
    }
    
    res.json(record);
  } catch (err) {
    console.error('Error getting user record:', err);
    res.status(500).json({ error: 'Error obteniendo expediente del usuario' });
  }
};

// Aprobar fase 1
export const approvePhase1 = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CONTROLADOR: APROBANDO FASE 1 ===');
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    console.log('ID:', id);
    console.log('Comment:', comment);
    console.log('User:', (req as any).user);
    
    await RecordModel.approvePhase1(id);
    console.log('Fase 1 aprobada en el modelo');
    
    // Agregar comentario si se proporciona (solo si el usuario es admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Verificar si el usuario existe en la tabla admins
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'activity',
            created_by: userId
          });
          console.log('Comentario agregado exitosamente');
        } else {
          console.log('Usuario no es admin, omitiendo comentario');
        }
      } catch (noteError) {
        console.error('Error agregando comentario:', noteError);
        // No fallar la operación si el comentario falla
      }
    }
    
    res.json({ message: 'Fase 1 aprobada exitosamente' });
  } catch (err) {
    console.error('Error approving phase 1:', err);
    res.status(500).json({ error: 'Error aprobando fase 1' });
  }
};

// Rechazar fase 1
export const rejectPhase1 = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    await RecordModel.rejectPhase1(id);
    
    // Agregar comentario si se proporciona (solo si el usuario es admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Verificar si el usuario existe en la tabla admins
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'activity',
            created_by: userId
          });
          console.log('Comentario de rechazo agregado exitosamente');
        } else {
          console.log('Usuario no es admin, omitiendo comentario de rechazo');
        }
      } catch (noteError) {
        console.error('Error agregando comentario de rechazo:', noteError);
        // No fallar la operación si el comentario falla
      }
    }
    
    res.json({ message: 'Fase 1 rechazada exitosamente' });
  } catch (err) {
    console.error('Error rejecting phase 1:', err);
    res.status(500).json({ error: 'Error rechazando fase 1' });
  }
};

// Aprobar expediente completo
export const approveRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    await RecordModel.approveRecord(id);
    
    // Agregar comentario si se proporciona (solo si el usuario es admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Verificar si el usuario existe en la tabla admins
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'milestone',
            created_by: userId
          });
          console.log('Comentario de aprobación agregado exitosamente');
        } else {
          console.log('Usuario no es admin, omitiendo comentario de aprobación');
        }
      } catch (noteError) {
        console.error('Error agregando comentario de aprobación:', noteError);
        // No fallar la operación si el comentario falla
      }
    }
    
    res.json({ message: 'Expediente aprobado exitosamente' });
  } catch (err) {
    console.error('Error approving record:', err);
    res.status(500).json({ error: 'Error aprobando expediente' });
  }
};

// Rechazar expediente completo
export const rejectRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    await RecordModel.rejectRecord(id);
    
    // Agregar comentario si se proporciona (solo si el usuario es admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Verificar si el usuario existe en la tabla admins
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'activity',
            created_by: userId
          });
          console.log('Comentario de rechazo agregado exitosamente');
        } else {
          console.log('Usuario no es admin, omitiendo comentario de rechazo');
        }
      } catch (noteError) {
        console.error('Error agregando comentario de rechazo:', noteError);
        // No fallar la operación si el comentario falla
      }
    }
    
    res.json({ message: 'Expediente rechazado exitosamente' });
  } catch (err) {
    console.error('Error rejecting record:', err);
    res.status(500).json({ error: 'Error rechazando expediente' });
  }
};

// Verificar disponibilidad de cédula
export const checkCedulaAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula } = req.params;
    const excludeRecordId = req.query.excludeRecordId ? parseInt(req.query.excludeRecordId as string) : undefined;
    
    const exists = await PersonalDataModel.checkCedulaExists(cedula, excludeRecordId);
    
    if (exists) {
      res.status(409).json({ error: 'Cédula ya registrada' });
      return;
    }
    
    res.json({ available: true });
  } catch (err) {
    console.error('Error checking cedula availability:', err);
    res.status(500).json({ error: 'Error verificando disponibilidad de cédula' });
  }
};

// Actualizar comentario
export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.noteId);
    const { note, type } = req.body;
    
    if (!note || note.trim() === '') {
      res.status(400).json({ error: 'El comentario no puede estar vacío' });
      return;
    }
    
    await RecordModel.updateNote(noteId, { note: note.trim(), type });
    
    res.json({ message: 'Comentario actualizado exitosamente' });
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Error actualizando comentario' });
  }
};

// Eliminar comentario
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.noteId);
    
    await RecordModel.deleteNote(noteId);
    
    res.json({ message: 'Comentario eliminado exitosamente' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Error eliminando comentario' });
  }
};



// Función temporal para verificar la estructura de la base de datos
export const debugDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== DEBUG DATABASE ===');
    
    // Verificar tabla records
    const [recordsStructure] = await db.query('DESCRIBE records');
    console.log('Estructura de tabla records:', recordsStructure);
    
    // Verificar tabla personal_data
    try {
      const [personalDataStructure] = await db.query('DESCRIBE personal_data');
      console.log('Estructura de tabla personal_data:', personalDataStructure);
      
      // Verificar si hay registros en personal_data
      const [personalDataCount] = await db.query('SELECT COUNT(*) as count FROM personal_data');
      console.log('Cantidad de registros en personal_data:', personalDataCount);
      
      res.json({ 
        message: 'Debug info logged to console',
        recordsStructure,
        personalDataStructure,
        personalDataCount,
        personalDataExists: true
      });
    } catch (personalDataError) {
      console.log('ERROR: Tabla personal_data no existe:', (personalDataError as Error).message);
      
      // Verificar si hay registros en records
      const [recordsCount] = await db.query('SELECT COUNT(*) as count FROM records');
      console.log('Cantidad de registros en records:', recordsCount);
      
      res.json({ 
        message: 'Debug info logged to console',
        recordsStructure,
        recordsCount,
        personalDataExists: false,
        personalDataError: (personalDataError as Error).message
      });
    }
  } catch (err) {
    console.error('Error en debugDatabase:', err);
    res.status(500).json({ error: 'Error obteniendo debug info', details: (err as Error).message || err });
  }
};

// Función simple para verificar si personal_data existe
export const checkPersonalDataTable = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CHECKING PERSONAL_DATA TABLE ===');
    
    const [result] = await db.query('SHOW TABLES LIKE "personal_data"');
    const exists = (result as any[]).length > 0;
    
    console.log('Tabla personal_data existe:', exists);
    
    if (exists) {
      const [structure] = await db.query('DESCRIBE personal_data');
      console.log('Estructura de personal_data:', structure);
      res.json({ exists: true, structure });
    } else {
      res.json({ exists: false, message: 'Tabla personal_data no existe' });
    }
  } catch (err) {
    console.error('Error checking personal_data table:', err);
    res.status(500).json({ error: 'Error verificando tabla', details: (err as Error).message });
  }
};

 