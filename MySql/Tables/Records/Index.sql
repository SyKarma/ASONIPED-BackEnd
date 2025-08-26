-- Index for records table status field - Optimizes queries filtering by status (draft, pending, approved, etc.)
CREATE INDEX idx_records_status ON records(status);

-- Index for records table created_at field - Optimizes queries filtering by creation date and sorting by date
CREATE INDEX idx_records_created_at ON records(created_at);

-- Index for records table record_number field - Optimizes searches by record number (EXP-2025-0001 format)
CREATE INDEX idx_records_number ON records(record_number);

-- Index for personal_data table cedula field - Optimizes searches by national ID number
CREATE INDEX idx_personal_data_cedula ON personal_data(cedula);

-- Index for personal_data table record_id field - Optimizes JOIN operations between records and personal_data tables
CREATE INDEX idx_personal_data_record_id ON personal_data(record_id);

-- Index for disability_data table disability_type field - Optimizes queries filtering by disability type (physical, visual, etc.)
CREATE INDEX idx_disability_data_type ON disability_data(disability_type);

-- Index for disability_data table record_id field - Optimizes JOIN operations between records and disability_data tables
CREATE INDEX idx_disability_data_record_id ON disability_data(record_id);

-- Index for record_documents table record_id field - Optimizes JOIN operations between records and documents tables
CREATE INDEX idx_documents_record_id ON record_documents(record_id);

-- Index for record_documents table document_type field - Optimizes queries filtering by document type (medical_diagnosis, birth_certificate, etc.)
CREATE INDEX idx_documents_type ON record_documents(document_type);

-- Index for record_notes table record_id field - Optimizes JOIN operations between records and notes tables
CREATE INDEX idx_notes_record_id ON record_notes(record_id);

-- Index for record_notes table created_at field - Optimizes queries filtering by note creation date and sorting by date
CREATE INDEX idx_notes_created_at ON record_notes(created_at);