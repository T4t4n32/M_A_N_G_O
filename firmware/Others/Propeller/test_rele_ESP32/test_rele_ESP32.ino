const int RELAY1 = 18;
const int RELAY2 = 19;

// Cambia esto si tu módulo es activo en LOW
const bool ACTIVE_LOW = true;

void relaySet(int pin, bool on) {
  digitalWrite(pin, ACTIVE_LOW ? !on : on);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);

  // Por defecto: relés apagados = ESP32
  relaySet(RELAY1, false);
  relaySet(RELAY2, false);

  Serial.println("Inicio en modo ESP32");
  Serial.println("Escribe 'r' para RF, 'e' para ESP32");
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();

    if (c == 'r') {
      relaySet(RELAY1, true);
      relaySet(RELAY2, true);
      Serial.println("Modo RF");
    }

    if (c == 'e') {
      relaySet(RELAY1, false);
      relaySet(RELAY2, false);
      Serial.println("Modo ESP32");
    }
  }
}