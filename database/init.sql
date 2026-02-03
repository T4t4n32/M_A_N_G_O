-- Habilitar TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Crear esquema para series temporales
CREATE SCHEMA IF NOT EXISTS timeseries;

-- Crear hypertable para datos de sensores
CREATE TABLE IF NOT EXISTS timeseries.sensor_data (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES public.sensors(id),
    timestamp TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    raw_value DOUBLE PRECISION,
    quality_flag INTEGER DEFAULT 0,
    metadata JSONB
);

-- Convertir a hypertable
SELECT create_hypertable(
    'timeseries.sensor_data',
    'timestamp',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Crear índices compuestos para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_timestamp 
ON timeseries.sensor_data (sensor_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_data_quality 
ON timeseries.sensor_data (timestamp, quality_flag) 
WHERE quality_flag > 0;

-- Crear políticas de retención (ejemplo: mantener 2 años)
SELECT add_retention_policy(
    'timeseries.sensor_data',
    INTERVAL '2 years'
);

-- Crear compresión para datos antiguos
ALTER TABLE timeseries.sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'sensor_id'
);

SELECT add_compression_policy(
    'timeseries.sensor_data',
    INTERVAL '30 days'
);

-- Crear vistas materializadas para agregaciones rápidas
CREATE MATERIALIZED VIEW IF NOT EXISTS timeseries.daily_aggregates
WITH (timescaledb.continuous) AS
SELECT
    sensor_id,
    time_bucket(INTERVAL '1 day', timestamp) as bucket,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as reading_count
FROM timeseries.sensor_data
GROUP BY sensor_id, time_bucket(INTERVAL '1 day', timestamp);

-- Crear política de actualización automática
SELECT add_continuous_aggregate_policy('timeseries.daily_aggregates',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);