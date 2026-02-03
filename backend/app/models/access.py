# backend/app/models/access.py - MODELO DE ACCESO Y AUDITORÍA
from datetime import datetime
from app import db
import enum
import secrets

class AccessStatus(enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    EXPIRED = 'expired'

class AccessRequest(db.Model):
    __tablename__ = 'access_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    institution_name = db.Column(db.String(200), nullable=False)
    institution_type = db.Column(db.String(50))  # NGO, University, Government, etc.
    purpose = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(AccessStatus), default=AccessStatus.PENDING)
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    review_notes = db.Column(db.Text)
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    institution = db.relationship('Institution', back_populates='access_requests')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])

class APIKey(db.Model):
    __tablename__ = 'api_keys'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, default=lambda: secrets.token_urlsafe(48))
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    is_active = db.Column(db.Boolean, default=True)
    last_used = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    # Permisos específicos
    can_read = db.Column(db.Boolean, default=True)
    can_write = db.Column(db.Boolean, default=False)
    can_delete = db.Column(db.Boolean, default=False)
    
    # Relaciones
    user = db.relationship('User', back_populates='api_keys')
    institution = db.relationship('Institution')

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)  # login, data_access, config_change
    resource_type = db.Column(db.String(50))  # sensor, user, institution
    resource_id = db.Column(db.Integer)
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relaciones
    user = db.relationship('User')
    
    __table_args__ = (
        db.Index('idx_audit_user_time', 'user_id', 'timestamp'),
        db.Index('idx_audit_action', 'action', 'timestamp'),
    )