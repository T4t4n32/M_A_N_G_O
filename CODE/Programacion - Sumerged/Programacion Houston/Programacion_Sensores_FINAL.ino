//Bibliotecas necesarias 
#include <OneWire.h>
#include <DallasTemperature.h>

//Declaracion de pines 
#define PIN_SENSOR 7
#define SensorPin A1
#define Turbidy_sensor A0

OneWire oneWire(PIN_SENSOR);
DallasTemperature sensors(&oneWire);

//Declaracion de variables 
unsigned long int avgValue;  
float b;
int buf[10],temp;
float Tension = 0.0;  
float NTU = 0.0;

//Declaracion pines de entrada, salida y ajustamos frecuencia
void setup() {
 
  Serial.begin(9600);  
  sensors.begin();   

}

void loop() {
//Adquision de datos 
PH();
Serial.print(",");
delay(500);
Turbidez();
Serial.print(",");
delay(500);
Temperatura();
Serial.print(",");
delay(500);

}


void Turbidez() {
  Tension = 0;  
  Tension = analogRead(Turbidy_sensor)/1024*5; }

  for(int i=0; i<500; i++)  
    {  
      Tension += ((float)analogRead(Turbidy_sensor)/1024)*5;  
    }  
    Tension = Tension/500;  
    Tension = redondeo(Tension,1);  
    
    if(Tension < 2.5){  
      NTU = 3000;  
    }else{  
      NTU = -1120.4*square(Tension)+5742.3*Tension-4352.9;   
    }  
 
  Serial.print(NTU);  
}     
float redondeo(float p_entera, int p_decimal)  

{  
  float multiplicador = powf( 10.0f, p_decimal);  
  p_entera = roundf(p_entera * multiplicador) / multiplicador;  
  return p_entera;  
}  


void PH (){

  for(int i=0;i<10;i++)      
  { 
    buf[i]=analogRead(SensorPin);
    delay(8);
  }
  for(int i=0;i<9;i++)        
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
  for(int i=2;i<8;i++)                      
    avgValue+=buf[i];
  float phValue=(float)avgValue*5.0/1024/6; 
  phValue=3.5*phValue;                      

  Serial.print(phValue,2);
  delay(200); 
  
}

void Temperatura (){

  sensors.requestTemperatures();  
  float temperaturaC = sensors.getTempCByIndex(0);  
  Serial.println(temperaturaC);

}
