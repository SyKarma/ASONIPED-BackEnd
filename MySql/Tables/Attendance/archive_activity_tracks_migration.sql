-- Soft-archive: hide activities from lists without deleting rows
ALTER TABLE activity_tracks
  ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0 AFTER updated_at;

CREATE INDEX idx_activity_tracks_archived ON activity_tracks(archived);
