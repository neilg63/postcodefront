export const zoneSchema = {
  pc: "",
  lat: 0,
  lng: 0,
  alt: 0,
  n: 0,
  e: 0,
  c: "",
  cy: "",
  d: "",
  wc: "",
  cs: "",
  lc: "",
  w: "",
  pn: "",
  r: "",
  gr: "",
  dist: 0,
  addresses: [],
  modifiedAt: "",
}

export const weatherSchema = {
  temperature: 0,
  datetime: "",
  humidity: 0,
  windSpeed: 0,
  dewPoint: 0,
  clouds: "",
  stationName: ""
}

export const wikipediaSchema = {
  summary: "",
  elevation: 0,
  feature: "",
  lng: 0,
  distance: 0,
  countryCode: "",
  rank: 0,
  lang: "",
  title: "",
  lat: 0,
  wikipediaUrl: ""
}

export const hasWeatherData = (weather) => {
  let valid = false;
  if (weather instanceof Object) {
    if (weather.stationName) {
      valid = weather.stationName.length > 1;
    }
  }
  return valid;
}