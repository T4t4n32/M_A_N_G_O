FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY lora_http_bridge.py /app/lora_http_bridge.py

CMD ["python", "-u", "/app/lora_http_bridge.py"]
