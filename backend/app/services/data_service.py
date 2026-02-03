# app/services/data_service.py
class DataService:
    @staticmethod
    def query_sensor_data(sensor_ids, start_time, end_time, **filters):
        """
        Consultar datos de sensores con filtros avanzados
        """
        # Usar TimescaleDB para consultas eficientes
        query = """
        SELECT time_bucket('1 hour', time) as bucket,
               sensor_id,
               avg(value) as avg_value,
               min(value) as min_value,
               max(value) as max_value,
               count(*) as samples
        FROM timeseries.sensor_data
        WHERE sensor_id IN :sensor_ids
          AND time BETWEEN :start_time AND :end_time
          AND quality_flag = 0
        GROUP BY bucket, sensor_id
        ORDER BY bucket DESC
        """
        
        # Ejecutar query
        results = db.session.execute(
            query,
            {
                'sensor_ids': tuple(sensor_ids),
                'start_time': start_time,