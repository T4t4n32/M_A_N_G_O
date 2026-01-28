# backend/app/models/sensor.py
"""
Modelos de base de datos para sensores y lecturas
"""
from datetime import datetime
from .. import db

class Device(db.Model):
    """Modelo para dispositivos/sensores"""
    __tablename__ = 'devices'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'sensor', 'receiver', 'gateway'
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    deployment_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_maintenance = db.Column(db.DateTime)
    battery_level = db.Column(db.Float)
    status = db.Column(db.String(20), default='active')  # 'active', 'maintenance', 'offline'
    firmware_version = db.Column(db.String(20))
    signal_strength = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con lecturas
    readings = db.relationship('SensorReading', backref='device', lazy='dynamic')
    
    def to_dict(self):
        """Convertir a diccionario para JSON"""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'location': {
                'lat': self.location_lat,
                'lng': self.location_lng
            } if self.location_lat and self.location_lng else None,
            'deployment_date': self.deployment_date.isoformat() if self.deployment_date else None,
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
            'battery_level': self.battery_level,
            'status': self.status,
            'firmware_version': self.firmware_version,
            'signal_strength': self.signal_strength,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class SensorReading(db.Model):
    """Modelo para lecturas de sensores"""
    __tablename__ = 'sensor_readings'
    
    id = db.Column(db.BigInteger, primary_key=True)
    device_id = db.Column(db.String(50), db.ForeignKey('devices.id'), nullable=False)
    sensor_type = db.Column(db.String(20), nullable=False)  # 'ph', 'temperature', 'turbidity'
    value = db.Column(db.Float, nullable=False)
    raw_value = db.Column(db.Integer)
    quality = db.Column(db.String(10), default='good')  # 'good', 'questionable', 'bad'
    battery_level = db.Column(db.Float)
    signal_strength = db.Column(db.Integer)
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    received_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed = db.Column(db.Boolean, default=False)
    calibration_status = db.Column(db.String(20), default='uncalibrated')
    
    def to_dict(self):
        """Convertir a diccionario para JSON"""
        return {
            'id': self.id,
            'device_id': self.device_id,
            'sensor_type': self.sensor_type,
            'value': self.value,
            'raw_value': self.raw_value,
            'quality': self.quality,
            'battery_level': self.battery_level,
            'signal_strength': self.signal_strength,
            'location': {
                'lat': self.location_lat,
                'lng': self.location_lng
            } if self.location_lat and self.location_lng else None,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'processed': self.processed,
            'calibration_status': self.calibration_status
        }

class Alert(db.Model):
    """Modelo para alertas y eventos"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.BigInteger, primary_key=True)
    device_id = db.Column(db.String(50), db.ForeignKey('devices.id'))
    alert_type = db.Column(db.String(30), nullable=False)  # 'battery_low', 'sensor_offline', etc.
    severity = db.Column(db.String(10), nullable=False)  # 'low', 'medium', 'high', 'critical'
    message = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON)  # Datos adicionales de la alerta
    acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_by = db.Column(db.String(50))
    acknowledged_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convertir a diccionario para JSON"""
        return {
            'id': self.id,
            'device_id': self.device_id,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'message': self.message,
            'data': self.data,
            'acknowledged': self.acknowledged,
            'acknowledged_by': self.acknowledged_by,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }