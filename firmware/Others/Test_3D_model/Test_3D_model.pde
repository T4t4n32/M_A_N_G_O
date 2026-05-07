import processing.serial.*;

Serial port;

float yaw = 0;
float pitch = 0;
float roll = 0;

float smoothYaw = 0;
float smoothPitch = 0;
float smoothRoll = 0;

String lastLine = "";

void setup() {
  size(900, 650, P3D);
  surface.setTitle("BNO080 + ESP32 - Visualizador 3D");

  println("Puertos disponibles:");
  printArray(Serial.list());

  // Intenta seleccionar automáticamente un puerto típico.
  String selectedPort = "";

  for (String p : Serial.list()) {
    String name = p.toLowerCase();

    if (
      name.contains("usb") ||
      name.contains("acm") ||
      name.contains("com") ||
      name.contains("wch") ||
      name.contains("ch340") ||
      name.contains("cp210")
    ) {
      selectedPort = p;
      break;
    }
  }

  // Si no detecta nada automático, usa el primer puerto.
  if (selectedPort.equals("") && Serial.list().length > 0) {
    selectedPort = Serial.list()[0];
  }

  if (selectedPort.equals("")) {
    println("ERROR: No se encontro ningun puerto serial.");
    exit();
  }

  println("Puerto seleccionado: " + selectedPort);

  port = new Serial(this, selectedPort, 921600);
  port.bufferUntil('\n');
}

void draw() {
  background(20);

  lights();

  // Suavizado visual simple
  smoothYaw = lerp(smoothYaw, yaw, 0.18);
  smoothPitch = lerp(smoothPitch, pitch, 0.18);
  smoothRoll = lerp(smoothRoll, roll, 0.18);

  // Texto
  fill(255);
  textSize(18);
  text("BNO080 + ESP32 - Visualizador 3D por USB", 25, 35);

  textSize(15);
  text("Yaw:   " + nf(smoothYaw, 1, 2), 25, 70);
  text("Pitch: " + nf(smoothPitch, 1, 2), 25, 95);
  text("Roll:  " + nf(smoothRoll, 1, 2), 25, 120);

  textSize(12);
  text("Ultima linea: " + lastLine, 25, height - 30);

  // Centro de la escena
  translate(width / 2, height / 2 + 40, 0);

  // Ajuste visual de ejes
  rotateX(radians(smoothPitch));
  rotateY(radians(-smoothYaw));
  rotateZ(radians(smoothRoll));

  drawAxes();

  // Cuerpo 3D del sensor / plataforma
  noStroke();
  fill(60, 140, 255);
  box(260, 40, 160);

  // Frente del objeto
  translate(150, 0, 0);
  fill(255, 80, 80);
  box(35, 50, 170);
}

void serialEvent(Serial p) {
  String line = p.readStringUntil('\n');

  if (line == null) {
    return;
  }

  line = trim(line);
  lastLine = line;

  String[] data = split(line, ',');

  // Formato esperado:
  // ms,samples,qx,qy,qz,qw,gx,gy,gz,yaw,pitch,roll
  if (data.length >= 12) {
    try {
      yaw = float(data[9]);
      pitch = float(data[10]);
      roll = float(data[11]);
    } catch (Exception e) {
      println("Linea invalida: " + line);
    }
  }
}

void drawAxes() {
  strokeWeight(4);

  // Eje X - rojo
  stroke(255, 0, 0);
  line(0, 0, 0, 180, 0, 0);

  // Eje Y - verde
  stroke(0, 255, 0);
  line(0, 0, 0, 0, 180, 0);

  // Eje Z - azul
  stroke(0, 120, 255);
  line(0, 0, 0, 0, 0, 180);

  strokeWeight(1);
}
