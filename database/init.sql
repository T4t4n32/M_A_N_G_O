-- database/init.sql
-- Script SQL para inicializar la base de datos local

-- Crear tablas básicas (si no existen)
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    domain VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(50) DEFAULT 'viewer',
    institution_id INTEGER REFERENCES institutions(id),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    institution_id INTEGER REFERENCES institutions(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    sensor_type VARCHAR(50),
    station_id INTEGER REFERENCES sensor_stations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar datos de prueba
INSERT INTO institutions (name, domain) 
VALUES ('INTEGRAMOS OE', 'integramosoe.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, institution_id, is_active)
VALUES 
    ('admin@local.com', 'Admin', 'Local', 'admin', 1, TRUE),
    ('investigador@local.com', 'Investigador', 'Prueba', 'researcher', 1, TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO sensor_stations (name, latitude, longitude, institution_id, is_public)
VALUES 
    ('Estación Río Local', 4.6097, -74.0817, 1, TRUE),
    ('Estación Lago Prueba', 4.7100, -74.1000, 1, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO sensors (device_id, name, sensor_type, station_id)
VALUES 
    ('sensor_temp_001', 'Sensor Temperatura 1', 'temperature', 1),
    ('sensor_ph_001', 'Sensor pH 1', 'ph', 1),
    ('sensor_turb_001', 'Sensor Turbidez 1', 'turbidity', 2)
ON CONFLICT (device_id) DO NOTHING;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos M.A.N.G.O. LOCAL inicializada';
    RAISE NOTICE '✅ Institución: INTEGRAMOS OE';
    RAISE NOTICE '✅ Usuarios: admin@local.com, investigador@local.com';
    RAISE NOTICE '✅ Sensores de prueba creados';
END $$;