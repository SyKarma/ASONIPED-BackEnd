import crypto from 'crypto';
import * as ActivityTrackModel from '../models/activity_track.model';
import type { ActivityTrack } from '../models/activity_track.model';

/** Public parking URLs rotate every 6 hours (HMAC window). */
export const PARKING_LINK_WINDOW_MS = 6 * 60 * 60 * 1000;

export function currentParkingWindowId(): number {
  return Math.floor(Date.now() / PARKING_LINK_WINDOW_MS);
}

export function parkingWindowExpiresAt(windowId: number): Date {
  return new Date((windowId + 1) * PARKING_LINK_WINDOW_MS);
}

export function signParkingLink(activityId: number, windowId: number, secret: string): string {
  const h = crypto.createHmac('sha256', secret);
  h.update(`p1|${activityId}|${windowId}`);
  return h.digest('hex').slice(0, 32);
}

export function buildParkingLinkSegment(activityId: number, windowId: number, secret: string): string {
  const sig = signParkingLink(activityId, windowId, secret);
  return `p1-${activityId}-${windowId}-${sig}`;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function parseSignedSegment(raw: string): { activityId: number; windowId: number; sig: string } | null {
  const m = /^p1-(\d+)-(\d+)-([a-f0-9]{32})$/i.exec(raw.trim());
  if (!m) return null;
  return { activityId: parseInt(m[1], 10), windowId: parseInt(m[2], 10), sig: m[3].toLowerCase() };
}

/** Legacy token: 48 hex chars (24 random bytes). */
function looksLikeLegacyParkingToken(t: string): boolean {
  return /^[a-f0-9]{48}$/i.test(t);
}

/**
 * Resolve activity for a public parking URL segment (signed, 6h windows) or legacy static token.
 */
export async function resolveActivityForPublicParkingToken(raw: string): Promise<ActivityTrack | null> {
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* use raw */
  }

  const parsed = parseSignedSegment(decoded);
  if (parsed) {
    const track = await ActivityTrackModel.getActivityTrackById(parsed.activityId);
    if (!track?.id || !track.parking_enabled || !track.parking_public_token) return null;
    const hasArchived = await ActivityTrackModel.hasActivityTracksArchivedColumn();
    if (hasArchived && track.archived) return null;

    const nowW = currentParkingWindowId();
    if (parsed.windowId !== nowW && parsed.windowId !== nowW - 1) return null;

    const expected = signParkingLink(parsed.activityId, parsed.windowId, track.parking_public_token);
    if (!timingSafeEqualHex(parsed.sig, expected)) return null;
    return track;
  }

  if (looksLikeLegacyParkingToken(decoded)) {
    return ActivityTrackModel.getActivityTrackByParkingToken(decoded);
  }

  return null;
}
