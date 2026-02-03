# app/models/access.py
class AuditLog(db.Model):
    """Registro de auditoría para todas las acciones"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    request_data = db.Column(db.JSON)
    response_status = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='audit_logs')
    
    @staticmethod
    def log_action(user_id, action, **kwargs):
        """Método helper para registrar acciones"""
        log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=kwargs.get('ip_address'),
            user_agent=kwargs.get('user_agent'),
            resource_type=kwargs.get('resource_type'),
            resource_id=kwargs.get('resource_id'),
            request_data=kwargs.get('request_data'),
            response_status=kwargs.get('response_status')
        )
        db.session.add(log)
        db.session.commit()