# backend/app/routes/auth.py - SISTEMA PROFESIONAL
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app import db, limiter
from app.models import User, UserRole, Institution, AccessRequest, AccessStatus, AuditLog
from app.utils.email import send_activation_email, send_password_reset_email
from app.utils.security import validate_institutional_email, rate_limit_key
import datetime

bp = Blueprint('auth', __name__, url_prefix='/auth')

# Rate limiting específico para auth
auth_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per day", "10 per minute"]
)

@bp.route('/register/request', methods=['POST'])
@auth_limiter.limit("5 per hour")
def request_access():
    """Solicitud de acceso institucional - PÚBLICO"""
    data = request.get_json()
    
    # Validaciones
    required_fields = ['email', 'institution_name', 'purpose']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    # Validar correo institucional
    if not validate_institutional_email(data['email']):
        return jsonify({
            'error': 'Email must be from a recognized institution (.edu, .gov, .org, etc.)',
            'allowed_domains': ['.edu', '.gov', '.org', '.gob', '.mil']
        }), 400
    
    # Verificar si ya existe solicitud pendiente
    existing = AccessRequest.query.filter_by(
        email=data['email'],
        status=AccessStatus.PENDING
    ).first()
    
    if existing:
        return jsonify({
            'message': 'Access request already pending. Please wait for approval.'
        }), 200
    
    # Crear solicitud
    access_request = AccessRequest(
        email=data['email'],
        institution_name=data['institution_name'],
        institution_type=data.get('institution_type', 'Other'),
        purpose=data['purpose'],
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30)
    )
    
    db.session.add(access_request)
    db.session.commit()
    
    # Notificar administradores
    from app.tasks import notify_admins_new_request
    notify_admins_new_request.delay(access_request.id)
    
    # Auditoría
    audit_log = AuditLog(
        action='access_request',
        resource_type='access_request',
        resource_id=access_request.id,
        details={'email': data['email'], 'institution': data['institution_name']},
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Access request submitted successfully. You will be notified by email.',
        'request_id': access_request.id
    }), 201

@bp.route('/register/complete/<token>', methods=['POST'])
def complete_registration(token):
    """Completar registro después de aprobación del administrador"""
    data = request.get_json()
    
    # Verificar token (en la vida real usaríamos JWT)
    access_request = AccessRequest.query.filter_by(
        approval_token=token,
        status=AccessStatus.APPROVED
    ).first_or_404()
    
    if 'password' not in data or len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # Crear usuario
    user = User(
        email=access_request.email,
        institution_id=access_request.institution_id,
        is_active=True,
        is_verified=False,
        role=UserRole.VIEWER  # Rol inicial básico
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    
    # Marcar solicitud como completada
    access_request.status = AccessStatus.COMPLETED
    access_request.completed_at = datetime.datetime.utcnow()
    
    db.session.commit()
    
    # Enviar email de bienvenida
    send_activation_email.delay(user.email, user.id)
    
    return jsonify({
        'message': 'Registration completed successfully. You can now login.'
    }), 201

@bp.route('/login', methods=['POST'])
@auth_limiter.limit("10 per minute")
def login():
    """Login con JWT tokens"""
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing email or password'}), 400
    
    # Buscar usuario
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        # Auditoría de intento fallido
        audit_log = AuditLog(
            action='login_failed',
            details={'email': data['email'], 'reason': 'invalid_credentials'},
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verificar si el usuario está activo
    if not user.is_active:
        return jsonify({'error': 'Account is not active. Contact administrator.'}), 403
    
    # Verificar si está verificado
    if not user.is_verified:
        return jsonify({
            'error': 'Email not verified',
            'resend_url': '/auth/verify/resend'
        }), 403
    
    # Actualizar último login
    user.last_login = datetime.datetime.utcnow()
    
    # Crear tokens JWT
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'role': user.role.value,
            'institution_id': user.institution_id,
            'email': user.email
        }
    )
    
    refresh_token = create_refresh_token(identity=user.id)
    
    # Auditoría de login exitoso
    audit_log = AuditLog(
        user_id=user.id,
        action='login_success',
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_active:
        return jsonify({'error': 'Invalid user'}), 401
    
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'role': user.role.value,
            'institution_id': user.institution_id,
            'email': user.email
        }
    )
    
    return jsonify({'access_token': access_token}), 200

@bp.route('/password/reset', methods=['POST'])
@auth_limiter.limit("5 per hour")
def request_password_reset():
    """Solicitar restablecimiento de contraseña"""
    data = request.get_json()
    
    if 'email' not in data:
        return jsonify({'error': 'Email is required'}), 400
    
    user = User.query.filter_by(email=data['email'], is_active=True).first()
    
    # Siempre devolver éxito (por seguridad)
    if user:
        # Crear token de restablecimiento
        reset_token = user.get_reset_token()
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        
        db.session.commit()
        
        # Enviar email
        send_password_reset_email.delay(user.email, reset_token)
    
    return jsonify({
        'message': 'If the email exists, you will receive a password reset link.'
    }), 200

@bp.route('/password/reset/<token>', methods=['POST'])
def reset_password(token):
    """Restablecer contraseña con token"""
    data = request.get_json()
    
    if 'password' not in data or len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    user = User.verify_reset_token(token)
    
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 400
    
    # Establecer nueva contraseña
    user.set_password(data['password'])
    user.reset_token = None
    user.reset_token_expiry = None
    
    db.session.commit()
    
    # Auditoría
    audit_log = AuditLog(
        user_id=user.id,
        action='password_reset',
        ip_address=request.remote_addr
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({'message': 'Password reset successfully'}), 200

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout (en servidor podríamos invalidar tokens)"""
    jti = get_jwt()['jti']
    
    # En un sistema real, añadiríamos el token a una blacklist
    from app import redis_client
    redis_client.setex(f'blacklist:{jti}', 3600, 'true')  # 1 hora
    
    return jsonify({'message': 'Logged out successfully'}), 200