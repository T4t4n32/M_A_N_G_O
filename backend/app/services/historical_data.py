# backend/app/services/historical_data.py
from flask import current_app
from ..models import SensorReading
from datetime import datetime, timedelta
import pandas as pd

class HistoricalDataService:
    @staticmethod
    def get_latest_readings(sensor_type, limit=10):
        """Obtiene las últimas lecturas de un sensor desde PostgreSQL"""
        try:
            # Si no hay conexión a BD, devolver datos vacíos
            if not current_app.config.get('DATABASE_CONNECTED', False):
                return []
                
            readings = SensorReading.query.filter_by(sensor_type=sensor_type)\
                .order_by(SensorReading.timestamp.desc())\
                .limit(limit)\
                .all()
                
            return [{
                'value': reading.sensor_value,
                'timestamp': reading.timestamp.isoformat(),
                'raw_value': reading.raw_value,
                'data_quality': reading.data_quality
            } for reading in readings]
            
        except Exception as e:
            current_app.logger.error(f"Error obteniendo datos históricos: {e}")
            return []

    @staticmethod
    def get_readings_by_range(sensor_type, start_time, end_time):
        """Obtiene lecturas en un rango de tiempo"""
        try:
            if not current_app.config.get('DATABASE_CONNECTED', False):
                return []
                
            readings = SensorReading.query.filter_by(sensor_type=sensor_type)\
                .filter(SensorReading.timestamp.between(start_time, end_time))\
                .order_by(SensorReading.timestamp)\
                .all()
                
            return [{
                'timestamp': reading.timestamp.isoformat(),
                'value': reading.sensor_value
            } for reading in readings]
            
        except Exception as e:
            current_app.logger.error(f"Error obteniendo rango de datos: {e}")
            return []