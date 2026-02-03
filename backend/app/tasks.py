from celery import Celery
from flask import current_app
from app import db, create_app
from app.models import User, AccessRequest
from app.utils.email import send_email

def make_celery(app):
    celery = Celery(
        app.import_name,
        broker=app.config['CELERY_BROKER_URL'],
        backend=app.config['CELERY_RESULT_BACKEND']
    )
    celery.conf.update(app.config)
    
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

# Crear aplicación Flask para Celery
flask_app = create_app()
celery = make_celery(flask_app)

@celery.task
def notify_admins_new_request(request_id):
    """Notificar a administradores sobre nueva solicitud"""
    with flask_app.app_context():
        access_request = AccessRequest.query.get(request_id)
        if not access_request:
            return
        
        admins = User.query.filter_by(
            role='system_admin',
            is_active=True
        ).all()
        
        for admin in admins:
            send_email(
                to=admin.email,
                subject='New Access Request - M.A.N.G.O.',
                template='new_request.html',
                context={
                    'request': access_request,
                    'admin': admin
                }
            )

@celery.task
def process_sensor_batch(data_batch):
    """Procesar lote de datos de sensores"""
    with flask_app.app_context():
        from app.models import SensorData, Sensor
        import datetime
        
        for data in data_batch:
            sensor = Sensor.query.filter_by(device_id=data['device_id']).first()
            if sensor:
                sensor_data = SensorData(
                    sensor_id=sensor.id,
                    timestamp=data.get('timestamp', datetime.datetime.utcnow()),
                    value=data['value'],
                    raw_value=data.get('raw_value'),
                    quality_flag=data.get('quality_flag', 0),
                    metadata=data.get('metadata', {})
                )
                db.session.add(sensor_data)
                
                # Actualizar último visto
                sensor.last_seen = datetime.datetime.utcnow()
        
        db.session.commit()