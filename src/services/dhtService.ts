import { DHT11Data } from '../types';

export class DHT11Sensor {
  private baseTemp: number = 21.5; // °C
  private baseHumidity: number = 45; // %
  private targetTemp: number = 22.0;
  private targetHumidity: number = 48;
  private errorRate: number = 0.02; // 2% chance of simulated DHT11 read timeout/checksum error (typical for single-wire DHT11)

  public generateReading(
    offsetTemp: number = 0,
    offsetHumidity: number = 0,
    gpioPin: number = 4
  ): DHT11Data {
    // Simulate slight natural temperature/humidity drift over time
    if (Math.random() < 0.3) {
      const tempDelta = (Math.random() - 0.5) * 0.2;
      this.baseTemp = Math.min(35, Math.max(10, this.baseTemp + tempDelta));
    }

    if (Math.random() < 0.3) {
      const humDelta = (Math.random() - 0.5) * 0.6;
      this.baseHumidity = Math.min(90, Math.max(15, this.baseHumidity + humDelta));
    }

    // Simulate occasional DHT11 timeout checksum warning
    const isError = Math.random() < this.errorRate;

    const finalTemp = Math.round((this.baseTemp + offsetTemp) * 10) / 10;
    const finalHumidity = Math.round((this.baseHumidity + offsetHumidity) * 10) / 10;

    return {
      temperature: finalTemp,
      humidity: finalHumidity,
      status: isError ? 'error' : 'online',
      lastReading: new Date(),
      gpioPin: gpioPin,
      errorCount: isError ? 1 : 0,
    };
  }
}

export const dht11Simulator = new DHT11Sensor();
