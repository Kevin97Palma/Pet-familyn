-- Pet-Family Database Initialization Script
-- This script creates the initial database structure for Pet-Family application
-- Compatible with PostgreSQL 13+

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sessions table for express-session storage
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create index on expire column for efficient cleanup
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table for authentication and profile information
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    password VARCHAR, -- For local authentication
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Families table for grouping users and pets
CREATE TABLE IF NOT EXISTS families (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Family members junction table with roles
CREATE TABLE IF NOT EXISTS family_members (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    family_id VARCHAR NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Pets table with comprehensive information
CREATE TABLE IF NOT EXISTS pets (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    family_id VARCHAR NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    species VARCHAR NOT NULL,
    breed VARCHAR,
    gender VARCHAR CHECK (gender IN ('male', 'female', 'unknown')),
    birth_date DATE,
    weight DECIMAL(5,2),
    color VARCHAR,
    microchip_id VARCHAR,
    profile_image_url VARCHAR,
    medical_notes TEXT,
    dietary_restrictions TEXT,
    location VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notes table for daily logs and veterinary records
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    pet_id VARCHAR NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    author_id VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR NOT NULL DEFAULT 'daily' CHECK (note_type IN ('daily', 'medical', 'behavior', 'feeding', 'exercise')),
    is_veterinary BOOLEAN DEFAULT false,
    veterinarian_name VARCHAR,
    clinic_name VARCHAR,
    note_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vaccinations table for immunization tracking
CREATE TABLE IF NOT EXISTS vaccinations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    pet_id VARCHAR NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    vaccine_name VARCHAR NOT NULL,
    vaccine_type VARCHAR NOT NULL,
    administered_date DATE NOT NULL,
    next_due_date DATE,
    veterinarian_name VARCHAR,
    clinic_name VARCHAR,
    batch_number VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pet files table for document and image storage
CREATE TABLE IF NOT EXISTS pet_files (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    pet_id VARCHAR NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    uploader_id VARCHAR NOT NULL REFERENCES users(id),
    file_name VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    file_size BIGINT,
    file_category VARCHAR DEFAULT 'general' CHECK (file_category IN ('photo', 'medical', 'document', 'general')),
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_family_id ON pets(family_id);
CREATE INDEX IF NOT EXISTS idx_pets_is_active ON pets(is_active);
CREATE INDEX IF NOT EXISTS idx_notes_pet_id ON notes(pet_id);
CREATE INDEX IF NOT EXISTS idx_notes_note_date ON notes(note_date);
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type);
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due_date ON vaccinations(next_due_date);
CREATE INDEX IF NOT EXISTS idx_pet_files_pet_id ON pet_files(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_files_file_category ON pet_files(file_category);

-- Create triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaccinations_updated_at BEFORE UPDATE ON vaccinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial demo data (optional - remove in production)
INSERT INTO users (id, email, first_name, last_name, password) VALUES
('user1', 'demo@petfamily.com', 'Demo', 'User', crypt('demo123', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

INSERT INTO families (id, name, description) VALUES
('family1', 'Familia Demo', 'Familia de demostración con mascotas de ejemplo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO family_members (family_id, user_id, role) VALUES
('family1', 'user1', 'admin')
ON CONFLICT (family_id, user_id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Pet-Family database initialized successfully!';
    RAISE NOTICE 'Tables created: users, families, family_members, pets, notes, vaccinations, pet_files, sessions';
    RAISE NOTICE 'Demo user created: demo@petfamily.com / demo123';
END $$;