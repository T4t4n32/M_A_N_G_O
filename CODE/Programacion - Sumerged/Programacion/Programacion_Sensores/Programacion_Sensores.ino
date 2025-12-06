#include <OneWire.h>
#include <DallasTemperature.h>
#define PIN_SENSOR 2 
#define SensorPin A1
#define Turbidy_sensor A0   
OneWire oneWire(PIN_SENSOR);
DallasTemperature sensors(&oneWire);
unsigned long int avgValue;  

float b;
float NTU = 0.0;  
float Tension = 0.0;  

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
  Tension = 0;  
  Tension = analogRead(Turbidy_sensor)/1024*5; // Mapeo de la lectura analógica  
  //Para compensar el ruido producido en el sensor tomamos 500 muestras y obtenemos la media  
  for(int i=0; i<500; i++)  
    {  
      Tension += ((float)analogRead(Turbidy_sensor)/1024)*5;  
    }  
    Tension = Tension/500;  
    Tension = redondeo(Tension,1);  
    //Para ajustarnos a la gráfica de la derecha  
    if(Tension < 2.5){  
      NTU = 3000;  
    }else{  
      NTU = -1120.4*square(Tension)+5742.3*Tension-4352.9;   
    }  

  Serial.print(NTU);  
}  
float redondeo(float p_entera, int p_decimal)  
{  
  float multiplicador = powf( 10.0f, p_decimal);  //redondeo a 2 decimales  
  p_entera = roundf(p_entera * multiplicador) / multiplicador;  
  return p_entera;  
}  
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
