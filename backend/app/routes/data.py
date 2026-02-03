# app/routes/data_ingest.py
@api.route('/ingest/mqtt')
class MQTTHook(Resource):
    @api.doc('mqtt_ingest')
    @api.expect(mqtt_payload_model)
    def post(self):
        """
        Webhook para ingesta MQTT
        Usado por gateways LoRa para enviar datos
        """
        data = api.payload
        
        # Validar firma
        if not validate_signature(data):
            api.abort(401, 'Firma inválida')
        
        # Procesar en background
        from app.tasks.sensor_tasks import process_mqtt_payload
        process_mqtt_payload.delay(data)
        
        return {'status': 'accepted'}, 202

@api.route('/ingest/http')
class HTTPIngest(Resource):
    @api.doc('http_ingest', security='Bearer Auth')
    @api.expect(sensor_data_batch_model)
    @jwt_required()
    @role_required('sensor_ingest')
    def post(self):
        """
        Ingesta HTTP para sensores con conectividad directa
        """
        data = api.payload
        
        # Validar límite de tasa
        if not rate_limit_check('sensor_ingest', get_jwt_identity()):
            api.abort(429, 'Límite de tasa excedido')
        
        # Procesar batch
        from app.tasks.sensor_tasks import process_http_batch
        task = process_http_batch.delay(data)
        
        return {'task_id': task.id, 'status': 'processing'}, 202