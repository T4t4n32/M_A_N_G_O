
#define SensorPin A1
#include <OneWire.h>
#include <DallasTemperature.h>
// Pin donde está conectado el sensor de datos
#define PIN_SENSOR 2 
// Configuración de la comunicación OneWire y el sensor de temperatura
OneWire oneWire(PIN_SENSOR);
DallasTemperature sensors(&oneWire);
const int turbidezPin = A0;
unsigned long int avgValue;  
float b;
int buf[10],temp;


void setup() {
  Serial.begin(9600);  // Iniciar la comunicación serial
  sensors.begin();     // Iniciar el sensor de temperatura
}

void loop() {
PH();
delay(600);
Serial.print(" ,");
Turbidez();
delay(600);
Serial.print(" ,");
delay(600);
Temperatura();
Serial.print(" ,");
delay(600);
}

void Turbidez() {
  int valorTurbidez = analogRead(turbidezPin);
  float voltaje = valorTurbidez*(5.0 / 1023.0);
  Serial.print(valorTurbidez);
  delay(200);
}

void PH (){
  for(int i=0;i<10;i++)      //Get 10 sample value from the sensor for smooth the value
  { 
    buf[i]=analogRead(SensorPin);
    delay(8);
  }
  for(int i=0;i<9;i++)        //sort the analog from small to large
  {
    for(int j=i+1;j<10;j++)
    {
      if(buf[i]>buf[j]);
      {
        temp=buf[i];
        buf[i]=buf[j];
        buf[j]=temp;
      }
    }
  }
  avgValue=0;
  for(int i=2;i<8;i++)                      //take the average value of 6 center sample
    avgValue+=buf[i];
  float phValue=(float)avgValue*5.0/1024/6; //convert the analog into millivolt
  phValue=3.5*phValue;                      //convert the millivolt into pH value

  Serial.print(phValue,2);
  delay(200); 
}

void Temperatura (){

  sensors.requestTemperatures();  // Solicitar la temperatura al sensor
  float temperaturaC = sensors.getTempCByIndex(0);  // Leer temperatura en °C
  Serial.println(temperaturaC);

}
