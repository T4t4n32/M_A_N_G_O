from werkzeug.middleware.proxy_fix import ProxyFix

from app import create_app

app = create_app()
# Trust exactly one level of proxy (nginx). Without this Flask sees every
# request as HTTP and request.is_secure is always False, breaking Secure cookies.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
