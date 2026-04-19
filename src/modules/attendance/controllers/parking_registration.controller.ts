import { Request, Response } from 'express';
import * as ActivityTrackModel from '../models/activity_track.model';
import type { ActivityTrack } from '../models/activity_track.model';
import { resolveActivityForPublicParkingToken } from '../utils/parking_public_link';
import * as ParkingModel from '../models/activity_parking_registration.model';
import * as AttendanceRecordModel from '../models/attendance_record.model';

function isDuplicatePlateError(err: unknown): boolean {
  const e = err as { code?: string };
  return e?.code === 'ER_DUP_ENTRY';
}

/**
 * Guest list in admin reads `attendance_records`; public parking only wrote to `activity_parking_registrations`.
 * When the visitor leaves a name, phone, or cédula, also add a guest row so staff see them under "Registros de asistencia".
 */
async function syncGuestAttendanceFromPublicParking(
  track: ActivityTrack,
  fullName: string,
  cedula: string,
  phone: string,
  plateRaw: string
): Promise<void> {
  const trimmedName = fullName.trim();
  const hasContact = Boolean(trimmedName || cedula.trim() || phone.trim());
  if (!hasContact) return;

  const displayName =
    trimmedName || `Vehículo ${plateRaw.slice(0, 32)}`;

  const phoneAttendance = phone.trim() ? phone.trim().slice(0, 20) : undefined;

  try {
    await AttendanceRecordModel.createAttendanceRecord({
      activity_track_id: track.id!,
      record_id: undefined,
      attendance_type: 'guest',
      full_name: displayName,
      cedula: cedula.trim() || undefined,
      phone: phoneAttendance,
      attendance_method: 'manual_form',
      created_by: track.created_by,
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return;
    }
    throw err;
  }
}

/** Public: resolve token → activity summary (no auth). */
export const getPublicParkingByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.params.token || '').trim();
    if (!token || token.length > 128) {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    const track = await resolveActivityForPublicParkingToken(token);
    if (!track || !track.parking_enabled) {
      res.status(404).json({ error: 'Registro de estacionamiento no disponible' });
      return;
    }

    if (track.status !== 'active') {
      res.status(403).json({ error: 'Esta actividad no acepta registros en este momento' });
      return;
    }

    res.json({
      activity: {
        id: track.id,
        name: track.name,
        event_date: track.event_date,
        event_time: track.event_time,
        location: track.location,
      },
    });
  } catch {
    res.status(500).json({ error: 'Error al cargar la actividad' });
  }
};

/** Public: submit parking registration (no auth). */
export const postPublicParkingByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.params.token || '').trim();
    if (!token || token.length > 128) {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    const track = await resolveActivityForPublicParkingToken(token);
    if (!track?.id || !track.parking_enabled) {
      res.status(404).json({ error: 'Registro de estacionamiento no disponible' });
      return;
    }

    if (track.status !== 'active') {
      res.status(403).json({ error: 'Esta actividad no acepta registros en este momento' });
      return;
    }

    const plateRaw = String(req.body.plate ?? req.body.placa ?? '').trim();
    if (!plateRaw || plateRaw.length < 2) {
      res.status(400).json({ error: 'La placa es obligatoria' });
      return;
    }

    const normalized = ParkingModel.normalizeParkingPlate(plateRaw);
    if (!normalized || normalized.length < 2) {
      res.status(400).json({ error: 'La placa no es válida' });
      return;
    }

    const fullName = req.body.full_name != null ? String(req.body.full_name).trim() : '';
    const cedula = req.body.cedula != null ? String(req.body.cedula).trim() : '';
    const phone = req.body.phone != null ? String(req.body.phone).trim() : '';

    try {
      const id = await ParkingModel.createParkingRegistration(
        track.id,
        plateRaw,
        normalized,
        fullName || null,
        cedula || null,
        phone || null,
        'public_link',
        null
      );

      try {
        await syncGuestAttendanceFromPublicParking(track, fullName, cedula, phone, plateRaw);
      } catch {
        // Parking ya guardado; la fila de invitado es complementaria
      }

      res.status(201).json({ message: 'Vehículo registrado', id });
    } catch (err) {
      if (isDuplicatePlateError(err)) {
        res.status(409).json({ error: 'Esta placa ya está registrada para esta actividad' });
        return;
      }
      throw err;
    }
  } catch {
    res.status(500).json({ error: 'Error al registrar el vehículo' });
  }
};

/** Admin: list parking rows for an activity. */
export const listParkingForActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      res.status(400).json({ error: 'ID de actividad inválido' });
      return;
    }

    const track = await ActivityTrackModel.getActivityTrackById(id);
    if (!track) {
      res.status(404).json({ error: 'Actividad no encontrada' });
      return;
    }

    const rows = await ParkingModel.listByActivityTrackId(id);
    res.json({ registrations: rows });
  } catch {
    res.status(500).json({ error: 'Error al listar registros de estacionamiento' });
  }
};

/** Admin: add parking row manually. */
export const createParkingForActivityAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as { user?: { userId?: number; id?: number } }).user?.userId ?? (req as { user?: { id?: number } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      res.status(400).json({ error: 'ID de actividad inválido' });
      return;
    }

    const track = await ActivityTrackModel.getActivityTrackById(id);
    if (!track?.id) {
      res.status(404).json({ error: 'Actividad no encontrada' });
      return;
    }

    if (!track.parking_enabled) {
      res.status(400).json({ error: 'El estacionamiento no está habilitado para esta actividad' });
      return;
    }

    const plateRaw = String(req.body.plate ?? req.body.placa ?? '').trim();
    if (!plateRaw || plateRaw.length < 2) {
      res.status(400).json({ error: 'La placa es obligatoria' });
      return;
    }

    const normalized = ParkingModel.normalizeParkingPlate(plateRaw);
    if (!normalized || normalized.length < 2) {
      res.status(400).json({ error: 'La placa no es válida' });
      return;
    }

    const fullName = req.body.full_name != null ? String(req.body.full_name).trim() : '';
    const cedula = req.body.cedula != null ? String(req.body.cedula).trim() : '';
    const phone = req.body.phone != null ? String(req.body.phone).trim() : '';

    try {
      const regId = await ParkingModel.createParkingRegistration(
        track.id,
        plateRaw,
        normalized,
        fullName || null,
        cedula || null,
        phone || null,
        'admin',
        userId
      );
      res.status(201).json({ message: 'Vehículo registrado', id: regId });
    } catch (err) {
      if (isDuplicatePlateError(err)) {
        res.status(409).json({ error: 'Esta placa ya está registrada para esta actividad' });
        return;
      }
      throw err;
    }
  } catch {
    res.status(500).json({ error: 'Error al registrar el vehículo' });
  }
};
