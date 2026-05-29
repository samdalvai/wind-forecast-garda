type OpenMeteoLocation = {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    pressure_msl: number[];
  };
};

export type WindData = {
  time: string;
  pressureBolzano: number;
  pressureGhedi: number;
  difference: number;
}[];

export async function getPressureFoehnData(): Promise<WindData> {
  const url =
    "https://api.open-meteo.com/v1/dwd-icon" +
    "?latitude=46.4983,45.4030" +
    "&longitude=11.3548,10.2760" +
    "&hourly=pressure_msl" +
    "&timezone=Europe/Rome" +
    "&forecast_days=7";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoLocation[];

  const bolzano = data[0];
  const ghedi = data[1];

  return bolzano.hourly.time.map((time, i) => {
    const pressureBolzano = bolzano.hourly.pressure_msl[i];
    const pressureGhedi = ghedi.hourly.pressure_msl[i];

    return {
      time,
      pressureBolzano,
      pressureGhedi,
      difference: pressureGhedi - pressureBolzano,
    };
  });
}
