import { db } from '../../../db';

export interface DisabilityData {
  id?: number;
  record_id: number;
  disability_type: 'fisica' | 'visual' | 'auditiva' | 'psicosocial' | 'cognitiva' | 'intelectual' | 'multiple';
  medical_diagnosis?: string;
  insurance_type?: 'rnc' | 'independiente' | 'privado' | 'otro';
  disability_origin?: 'nacimiento' | 'accidente' | 'enfermedad';
  disability_certificate?: 'si' | 'no' | 'en_tramite';
  conapdis_registration?: 'si' | 'no' | 'en_tramite';
  observations?: string;
}

export interface BiomechanicalBenefit {
  id?: number;
  disability_data_id: number;
  type: 'silla_ruedas' | 'baston' | 'andadera' | 'audifono' | 'baston_guia' | 'otro';
  other_description?: string;
}

export interface PermanentLimitation {
  id?: number;
  disability_data_id: number;
  limitation: 'moverse_caminar' | 'ver_lentes' | 'oir_audifono' | 'comunicarse_hablar' | 'entender_aprender' | 'relacionarse';
  degree: 'leve' | 'moderada' | 'severa' | 'no_se_sabe';
  observations?: string;
}

export interface MedicalAdditionalInfo {
  id?: number;
  disability_data_id: number;
  diseases?: string;
  blood_type?: string;
  medical_observations?: string;
}

// Helper function to clean values
const cleanValue = (value: any): any => {
  if (value === null || value === undefined || value === '') return null;
  return value;
};

// Create or update disability data
export const createOrUpdateDisabilityData = async (recordId: number, disabilityData: any): Promise<void> => {
  try {
    // Check if disability data already exists
    const [existingRows] = await db.query(
      'SELECT id FROM disability_data WHERE record_id = ?',
      [recordId]
    ) as [any[], any];

    if (existingRows.length > 0) {
      // Update existing disability data
      await db.query(
        `UPDATE disability_data SET 
         disability_type = ?, medical_diagnosis = ?, insurance_type = ?, 
         disability_origin = ?, disability_certificate = ?, conapdis_registration = ?,
         observations = ?
         WHERE record_id = ?`,
        [
          cleanValue(disabilityData.disability_type),
          cleanValue(disabilityData.medical_diagnosis),
          cleanValue(disabilityData.insurance_type),
          cleanValue(disabilityData.disability_origin),
          cleanValue(disabilityData.disability_certificate),
          cleanValue(disabilityData.conapdis_registration),
          cleanValue(disabilityData.observations),
          recordId
        ]
      );
    } else {
      // Insert new disability data
      await db.query(
        `INSERT INTO disability_data 
         (record_id, disability_type, medical_diagnosis, insurance_type, 
          disability_origin, disability_certificate, conapdis_registration, observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          cleanValue(disabilityData.disability_type),
          cleanValue(disabilityData.medical_diagnosis),
          cleanValue(disabilityData.insurance_type),
          cleanValue(disabilityData.disability_origin),
          cleanValue(disabilityData.disability_certificate),
          cleanValue(disabilityData.conapdis_registration),
          cleanValue(disabilityData.observations)
        ]
      );
    }

    // Get the disability_data_id for related tables
    const [disabilityRows] = await db.query(
      'SELECT id FROM disability_data WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    const disabilityDataId = disabilityRows[0].id;

    // Handle biomechanical benefits
    if (disabilityData.medical_additional?.biomechanical_benefit) {
      // Delete existing benefits
      await db.query('DELETE FROM biomechanical_benefits WHERE disability_data_id = ?', [disabilityDataId]);
      
      // Insert new benefits
      for (const benefit of disabilityData.medical_additional.biomechanical_benefit) {
        await db.query(
          'INSERT INTO biomechanical_benefits (disability_data_id, type, other_description) VALUES (?, ?, ?)',
          [disabilityDataId, benefit.type, benefit.other_description || null]
        );
      }
    }

    // Handle permanent limitations
    if (disabilityData.medical_additional?.permanent_limitations) {
      // Delete existing limitations
      await db.query('DELETE FROM permanent_limitations WHERE disability_data_id = ?', [disabilityDataId]);
      
      // Insert new limitations
      for (const limitation of disabilityData.medical_additional.permanent_limitations) {
        await db.query(
          'INSERT INTO permanent_limitations (disability_data_id, limitation, degree, observations) VALUES (?, ?, ?, ?)',
          [disabilityDataId, limitation.limitation, limitation.degree, limitation.observations || null]
        );
      }
    }

    // Handle medical additional info
    if (disabilityData.medical_additional) {
      // Delete existing medical info
      await db.query('DELETE FROM medical_additional_info WHERE disability_data_id = ?', [disabilityDataId]);
      
      // Insert new medical info
      await db.query(
        'INSERT INTO medical_additional_info (disability_data_id, diseases, blood_type, medical_observations) VALUES (?, ?, ?, ?)',
        [
          disabilityDataId,
          cleanValue(disabilityData.medical_additional.diseases),
          cleanValue(disabilityData.medical_additional.blood_type),
          cleanValue(disabilityData.medical_additional.medical_observations)
        ]
      );
    }

  } catch (err) {
    console.error('Error in createOrUpdateDisabilityData:', err);
    throw err;
  }
};

// Get disability data with all related information
export const getDisabilityData = async (recordId: number): Promise<any> => {
  try {
    // Get main disability data
    const [disabilityRows] = await db.query(
      'SELECT * FROM disability_data WHERE record_id = ?',
      [recordId]
    ) as [any[], any];

    if (disabilityRows.length === 0) {
      return null;
    }

    const disabilityData = disabilityRows[0];

    // Get biomechanical benefits
    const [benefitRows] = await db.query(
      'SELECT * FROM biomechanical_benefits WHERE disability_data_id = ?',
      [disabilityData.id]
    ) as [any[], any];

    // Get permanent limitations
    const [limitationRows] = await db.query(
      'SELECT * FROM permanent_limitations WHERE disability_data_id = ?',
      [disabilityData.id]
    ) as [any[], any];

    // Get medical additional info
    const [medicalRows] = await db.query(
      'SELECT * FROM medical_additional_info WHERE disability_data_id = ?',
      [disabilityData.id]
    ) as [any[], any];

    // Combine all data
    return {
      ...disabilityData,
      medical_additional: {
        biomechanical_benefit: benefitRows,
        permanent_limitations: limitationRows,
        diseases: medicalRows[0]?.diseases || null,
        blood_type: medicalRows[0]?.blood_type || null,
        medical_observations: medicalRows[0]?.medical_observations || null
      }
    };

  } catch (err) {
    console.error('Error in getDisabilityData:', err);
    throw err;
  }
};
