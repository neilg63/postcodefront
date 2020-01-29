export const deg2rad = deg => {
  return deg * (Math.PI / 180)
}

export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export const getDistanceFromCoordsInKm = (coordsFrom, coordsTo) => {
  if (coordsFrom instanceof Object && coordsTo instanceof Object) {
    return getDistanceFromLatLonInKm(coordsFrom.lat, coordsFrom.lng, coordsTo.lat, coordsTo.lng);
  } else {
    return 0;
  }
}

export const calcKmPerDegree = coords => {
  const { lat, lng } = coords;
  let lat2 = 0;
  let lng2 = 0;
  if (lat <= 89) {
    lat2 = lat + 1;
  } else {
    lat2 = lat - 1;
  }
  if (lng > 179) {
    lng2 = lng - 1;
  } else {
    lng2 = lng + 1;
  }
  return {
    x: getDistanceFromLatLonInKm(lat, lng, lat, lng2),
    y: getDistanceFromLatLonInKm(lat, lng, lat2, lng)
  }
}

export const calcDegreesPerKm = coords => {
  const dist = calcKmPerDegree(coords);
  return {
    x: 1 / dist.x,
    y: 1 / dist.y
  }
};

export const convertDDToDMS = (dd = 0.0, lng = false) => {
  return {
    dir: dd < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
    deg: 0 | (dd < 0 ? dd = -dd : dd),
    min: 0 | dd % 1 * 60,
    sec: (0 | dd * 60 % 1 * 6000) / 100
  };
}

export const displayDMS = pair => {
  if (pair instanceof Array && pair.length === 2) {
    const [px, py] = pair;
    const x = convertDDToDMS(px, true);
    const y = convertDDToDMS(py, false);
    const asDisplayString = dms =>
      `${dms.deg}º ${dms.min}' ${dms.sec}" ${dms.dir}`;
    return [asDisplayString(y), asDisplayString(x)].join(", ");
  } else {
    return "";
  }
}

const showGeoLoc = (data, callback) => {
  if (data.coords) {
    callback(data.coords);
  }
}

const handleGeoLocError = error => {
  console.log(error)
}

export const fetchGeo = (callback) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(data => showGeoLoc(data, callback), handleGeoLocError);
  }
}