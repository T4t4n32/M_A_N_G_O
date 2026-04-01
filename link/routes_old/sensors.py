# app/routes/sensors.py
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Sensor, SensorStation
from app.services.sensor_service import SensorService
from app.utils.decorators import role_required

sensors_ns = Namespace('sensors', description='Operaciones con sensores')

# Modelos para documentación Swagger
sensor_model = sensors_ns.model('Sensor', {
    'id': fields.Integer(description='ID del sensor'),
    'device_id': fields.String(required=True, description='ID físico del dispositivo'),
    'name': fields.String(description='Nombre del sensor'),
    'sensor_type': fields.String(required=True, description='Tipo de sensor'),
    'station_id': fields.Integer(description='ID de la estación'),
    'is_active': fields.Boolean(default=True),
    'last_seen': fields.DateTime(description='Última comunicación')
})

sensor_data_model = sensors_ns.model('SensorData', {
    'sensor_id': fields.Integer(required=True),
    'timestamp': fields.DateTime(required=True),
    'value': fields.Float(required=True),
    'quality_flag': fields.Integer(default=0),
    'metadata': fields.Raw(description='Metadatos adicionales')
})

@sensors_ns.route('/')
class SensorList(Resource):
    @sensors_ns.doc('list_sensors', security='Bearer Auth')
    @sensors_ns.param('station_id', 'Filtrar por estación')
    @sensors_ns.param('active_only', 'Mostrar solo sensores activos', type=bool)
    @sensors_ns.marshal_list_with(sensor_model)
    @jwt_required()
    @role_required('researcher', 'data_scientist', 'admin')
    def get(self):
        """Listar todos los sensores accesibles"""
        user_id = get_jwt_identity()
        station_id = sensors_ns.payload.get('station_id')
        active_only = sensors_ns.payload.get('active_only', True)
        
        sensors = SensorService.get_accessible_sensors(
            user_id=user_id,
            station_id=station_id,
            active_only=active_only
        )
        
        return sensors, 200
    
    @sensors_ns.doc('create_sensor', security='Bearer Auth')
    @sensors_ns.expect(sensor_model)
    @sensors_ns.marshal_with(sensor_model, code=201)
    @jwt_required()
    @role_required('admin', 'institution_admin')
    def post(self):
        """Crear un nuevo sensor"""
        user_id = get_jwt_identity()
        data = sensors_ns.payload
        
        # Validar que el usuario puede agregar sensores a esta estación
        if not SensorService.can_manage_station(user_id, data.get('station_id')):
            sensors_ns.abort(403, 'No tiene permisos para agregar sensores a esta estación')
        
        sensor = SensorService.create_sensor(user_id, data)
        return sensor, 201

@sensors_ns.route('/<int:sensor_id>')
@sensors_ns.response(404, 'Sensor no encontrado')
@sensors_ns.response(403, 'No autorizado')
class SensorResource(Resource):
    @sensors_ns.doc('get_sensor', security='Bearer Auth')
    @sensors_ns.marshal_with(sensor_model)
    @jwt_required()
    def get(self, sensor_id):
        """Obtener información de un sensor específico"""
        user_id = get_jwt_identity()
        
        sensor = SensorService.get_sensor_with_permission(sensor_id, user_id)
        if not sensor:
            sensors_ns.abort(404, 'Sensor no encontrado o no autorizado')
        
        return sensor, 200
    
    @sensors_ns.doc('update_sensor', security='Bearer Auth')
    @sensors_ns.expect(sensor_model)
    @sensors_ns.marshal_with(sensor_model)
    @jwt_required()
    @role_required('admin', 'institution_admin')
    def put(self, sensor_id):
        """Actualizar información de un sensor"""
        user_id = get_jwt_identity()
        data = sensors_ns.payload
        
        if not SensorService.can_manage_sensor(user_id, sensor_id):
            sensors_ns.abort(403, 'No tiene permisos para modificar este sensor')
        
        updated_sensor = SensorService.update_sensor(sensor_id, data)
        return updated_sensor, 200

@sensors_ns.route('/<int:sensor_id>/data')
class SensorDataResource(Resource):
    @sensors_ns.doc('get_sensor_data', security='Bearer Auth')
    @sensors_ns.param('start_time', 'Fecha inicio (ISO 8601)')
    @sensors_ns.param('end_time', 'Fecha fin (ISO 8601)')
    @sensors_ns.param('limit', 'Límite de registros', type=int, default=1000)
    @sensors_ns.param('aggregate', 'Agregación (hourly, daily, monthly)')
    @sensors_ns.marshal_list_with(sensor_data_model)
    @jwt_required()
    def get(self, sensor_id):
        """Obtener datos históricos de un sensor"""
        user_id = get_jwt_identity()
        
        # Verificar permisos
        if not SensorService.can_access_sensor(user_id, sensor_id):
            sensors_ns.abort(403, 'No tiene acceso a este sensor')
        
        # Obtener parámetros
        start_time = sensors_ns.payload.get('start_time')
        end_time = sensors_ns.payload.get('end_time')
        limit = sensors_ns.payload.get('limit', 1000)
        aggregate = sensors_ns.payload.get('aggregate')
        
        # Obtener datos
        data = SensorService.get_sensor_data(
            sensor_id=sensor_id,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            aggregate=aggregate
        )
        
        return data, 200
    
    @sensors_ns.doc('ingest_sensor_data', security='Bearer Auth')
    @sensors_ns.expect(sensor_data_model)
    @jwt_required()
    @role_required('admin', 'sensor_ingest')
    def post(self, sensor_id):
        """Ingestar datos de un sensor (para gateways)"""
        data = sensors_ns.payload
        
        # Validar que el sensor existe
        sensor = Sensor.query.get(sensor_id)
        if not sensor:
            sensors_ns.abort(404, 'Sensor no encontrado')
        
        # Procesar datos (tarea asíncrona)
        from app.tasks.sensor_tasks import process_sensor_data
        process_sensor_data.delay(sensor_id, data)
        
        return {'message': 'Datos en proceso de ingesta'}, 202