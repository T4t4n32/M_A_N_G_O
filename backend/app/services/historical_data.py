# backend/app/services/historical_data.py
"""
Servicio para manejo de datos históricos desde PostgreSQL
"""
from flask import current_app
from datetime import datetime, timedelta
from ..models import SensorReading
from .. import db

class HistoricalDataService:
    """Servicio para acceso a datos históricos"""
    
    @staticmethod
    def get_latest_readings(sensor_type, limit=10):
        """
        Obtiene las últimas lecturas de un sensor desde PostgreSQL
        """
        try:
            if sensor_type == 'all':
                readings = SensorReading.query\
                    .order_by(SensorReading.timestamp.desc())\
                    .limit(limit * 3)\
                    .all()
                
                # Agrupar por tipo de sensor
                results = {'ph': [], 'temperature': [], 'turbidity': []}
                for reading in readings:
                    if len(results[reading.sensor_type]) < limit:
                        results[reading.sensor_type].append(reading.to_dict())
                return results
            else:
                readings = SensorReading.query\
                    .filter_by(sensor_type=sensor_type)\
                    .order_by(SensorReading.timestamp.desc())\
                    .limit(limit)\
                    .all()
                
                return [reading.to_dict() for reading in readings]
                
        except Exception as e:
            current_app.logger.error(f"Error obteniendo datos históricos: {e}")
            return []
    
    @staticmethod
    def get_readings_by_range(sensor_type, start_time, end_time):
        """
        Obtiene lecturas en un rango de tiempo
        """
        try:
            readings = SensorReading.query\
                .filter_by(sensor_type=sensor_type)\
                .filter(SensorReading.timestamp.between(start_time, end_time))\
                .order_by(SensorReading.timestamp)\
                .all()
            
            return [reading.to_dict() for reading in readings]
            
        except Exception as e:
            current_app.logger.error(f"Error obteniendo rango de datos: {e}")
            return []
    
    @staticmethod
    def save_reading(device_id, sensor_type, value, raw_value=None, location=None):
        """
        Guarda una nueva lectura en la base de datos
        """
        try:
            reading = SensorReading(
                device_id=device_id,
                sensor_type=sensor_type,
                value=value,
                raw_value=raw_value,
                location_lat=location[0] if location else None,
                location_lng=location[1] if location else None
            )
            
            db.session.add(reading)
            db.session.commit()
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error guardando lectura: {e}")
            db.session.rollback()
            return False