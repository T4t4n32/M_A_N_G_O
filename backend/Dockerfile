FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Paquetes del sistema:
# - curl: para healthcheck
# - libpq5: runtime para postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl libpq5 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

RUN python -m pip install --upgrade pip \
  && pip install -r requirements.txt \
  && pip install gunicorn==25.0.1

COPY . /app

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

CMD ["gunicorn", "-w", "2", "--threads", "4", "--timeout", "60", "-b", "0.0.0.0:5000", "wsgi:app"]
