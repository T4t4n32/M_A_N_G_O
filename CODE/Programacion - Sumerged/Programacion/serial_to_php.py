import serial
import requests

# Configuración del puerto serial
arduino_port = 'COM3'      # Cambia a tu puerto serial (ejemplo: COM3 en Windows, /dev/ttyUSB0 en Linux)
baud_rate = 9600           # Debe coincidir con la velocidad configurada en el Arduino
url = "http://localhost/arduino/datos.php"  # URL de tu archivo PHP

# Conectar al puerto serial
ser = serial.Serial(arduino_port, baud_rate)

print("Conectado al puerto serial: ", arduino_port)

while True:
    try:
        # Leer línea de datos del Arduino y decodificar
        line = ser.readline().decode('utf-8').strip()
        print("Datos recibidos:", line)

        # Dividir los datos en sensor y valor
        data = line.split(",")
        if len(data) == 2:
            sensor = data[0]
            valor = data[1]

            # Enviar datos a PHP mediante una solicitud GET
            response = requests.get(url, params={'sensor': sensor, 'valor': valor})
            print("Respuesta del servidor:", response.text)

    except Exception as e:
        print("Error:", e)
        break
