# backend/app/models/user.py - MODELO COMPLETO
from datetime import datetime
from app import db
import enum
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
import jwt
from time import time

class UserRole(enum.Enum):
    SYSTEM_ADMIN = 'system_admin'
    INSTITUTION_ADMIN = 'institution_admin'
    DATA_SCIENTIST = 'data_scientist'
    RESEARCHER = 'researcher'
    VIEWER = 'viewer'
    EDUCATOR = 'educator'

class Institution(db.Model):
    __tablename__ = 'institutions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    domain = db.Column(db.String(100), nullable=False)  # para validar emails
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    max_users = db.Column(db.Integer, default=10)
    max_stations = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    users = db.relationship('User', back_populates='institution', lazy='dynamic')
    stations = db.relationship('SensorStation', back_populates='institution', lazy='dynamic')
    access_requests = db.relationship('AccessRequest', back_populates='institution', lazy='dynamic')

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role = db.Column(db.Enum(UserRole), default=UserRole.VIEWER)
    is_active = db.Column(db.Boolean, default=False)  # Debe activarse manualmente
    is_verified = db.Column(db.Boolean, default=False)
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Campos para restablecimiento de contraseña
    reset_token = db.Column(db.String(100))
    reset_token_expiry = db.Column(db.DateTime)
    
    # Relaciones
    institution = db.relationship('Institution', back_populates='users')
    api_keys = db.relationship('APIKey', back_populates='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_reset_token(self, expires_in=3600):
        return jwt.encode(
            {'reset_password': self.id, 'exp': time() + expires_in},
            current_app.config['SECRET_KEY'], algorithm='HS256'
        )
    
    @staticmethod
    def verify_reset_token(token):
        try:
            id = jwt.decode(token, current_app.config['SECRET_KEY'],
                           algorithms=['HS256'])['reset_password']
        except:
            return None
        return User.query.get(id)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.value,
            'institution': self.institution.name if self.institution else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }