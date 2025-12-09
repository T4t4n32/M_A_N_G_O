import serial
import mysql.connector
import time
while True:
   
    ser = serial.Serial('COM11', 9600)  # Cambia 'COM3' según tu configuración

    # Configuración de la base de datos
    db_config = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "robotica"
    }

    try:
        # Leer datos del puerto serie
        line = ser.readline().decode('utf-8').strip()
        # Supongamos que los datos llegan como: "7.2,3.5,25.7"
        ph_value, turbidez_value, temperatura_value = map(float, line.split(','))

        # Conectar a la base de datos
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Insertar datos en la tabla
        sql = "INSERT INTO datos_sensores (ph, turbidez, temperatura) VALUES (%s, %s, %s)"
        values = (ph_value, turbidez_value, temperatura_value)
        cursor.execute(sql, values)
        conn.commit()

        print("Datos enviados exitosamente a la base de datos. ")
        print(line)

    except Exception as e:
        print(f"Error: {e}")

    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
        if 'ser' in locals():
            ser.close()
    time.sleep(10)
