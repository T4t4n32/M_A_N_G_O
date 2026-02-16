FROM python:3.12-slim

WORKDIR /app

COPY requirements.bridge.txt /app/requirements.bridge.txt
RUN pip install --no-cache-dir -r /app/requirements.bridge.txt

COPY lora_http_bridge.py /app/lora_http_bridge.py

ENV PYTHONUNBUFFERED=1
CMD ["python", "-u", "/app/lora_http_bridge.py"]
