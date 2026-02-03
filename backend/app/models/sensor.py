# backend/app/models/sensor.py - MODELO DE SENSORES
from datetime import datetime
from app import db
import enum

class SensorType(enum.Enum):
    TEMPERATURE = 'temperature'
    TURBIDITY = 'turbidity'
    PH = 'ph'
    DISSOLVED_OXYGEN = 'dissolved_oxygen'
    SALINITY = 'salinity'
    CONDUCTIVITY = 'conductivity'
    DEPTH = 'depth'
    PRESSURE = 'pressure'

class SensorStation(db.Model):
    __tablename__ = 'sensor_stations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    elevation = db.Column(db.Float)  # metros sobre nivel del mar
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    is_public = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    deployment_date = db.Column(db.DateTime)
    last_maintenance = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    institution = db.relationship('Institution', back_populates='stations')
    sensors = db.relationship('Sensor', back_populates='station', lazy='dynamic')
    
    # Índices para búsquedas geográficas
    __table_args__ = (
        db.Index('idx_station_location', 'latitude', 'longitude'),
    )

class Sensor(db.Model):
    __tablename__ = 'sensors'
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(100), unique=True, nullable=False)  # ID físico del dispositivo
    name = db.Column(db.String(100))
    sensor_type = db.Column(db.Enum(SensorType), nullable=False)
    station_id = db.Column(db.Integer, db.ForeignKey('sensor_stations.id'))
    manufacturer = db.Column(db.String(100))
    model = db.Column(db.String(100))
    serial_number = db.Column(db.String(100))
    calibration_date = db.Column(db.DateTime)
    calibration_due = db.Column(db.DateTime)
    min_range = db.Column(db.Float)
    max_range = db.Column(db.Float)
    accuracy = db.Column(db.Float)
    unit = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    last_seen = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    station = db.relationship('SensorStation', back_populates='sensors')
    data_points = db.relationship('SensorData', back_populates='sensor', lazy='dynamic')
    
    __table_args__ = (
        db.Index('idx_sensor_device', 'device_id'),
        db.Index('idx_sensor_station', 'station_id', 'sensor_type'),
    )

class SensorData(db.Model):
    __tablename__ = 'sensor_data'
    __table_args__ = {'schema': 'timeseries'}
    
    id = db.Column(db.BigInteger, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    raw_value = db.Column(db.Float)  # Valor crudo del sensor
    quality_flag = db.Column(db.Integer, default=0)  # 0=bueno, 1=dudoso, 2=malo
    metadata = db.Column(db.JSON)  # Información adicional
    
    # Relaciones
    sensor = db.relationship('Sensor', back_populates='data_points')
    
    # Índices para consultas eficientes
    __table_args__ = (
        db.Index('idx_sensor_timestamp', 'sensor_id', 'timestamp'),
        db.Index('idx_timestamp_quality', 'timestamp', 'quality_flag'),
    )