export const deg2rad = deg => {
  return deg * (Math.PI / 180)
}

export const validUKPostcode = postcode => {
  return /\b((?:(?:gir)|(?:[a-pr-uwyz])(?:(?:[0-9](?:[a-hjkpstuw]|[0-9])?)|(?:[a-hk-y][0-9](?:[0-9]|[abehmnprv-y])?)))) ?([0-9][abd-hjlnp-uw-z]{2})\b/i.test(postcode);
}

export const isNumeric = inval => {
  let valid = false;
  switch (typeof inval) {
    case 'string':
      if (/^\s*-?\d+/.test(inval)) {
        valid = !isNaN(parseFloat(inval));
      }
      break;
    case 'number':
      valid = !isNaN(inval);
      break;
  }
  return valid;
}

export const toDistUnits = (km, unit) => {
  let str = "";
  if (isNumeric(km)) {
    const fv = parseFloat(km);
    switch (unit) {
      case 'yards':
        str = Math.round(fv * (1000 / 0.9144)) + " yds";
        break;
      default:
        str = Math.round(fv * 1000) + " m.";
        break;
    }
  }
  return str;
};

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

export const cleanString = str => {
  if (typeof str === 'string') {
    str = str.trim().toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-');
  }
  return str;
}

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
      `${dms.dir} ${dms.deg}º ${dms.min}' ${dms.sec}"`;
    return [asDisplayString(y), asDisplayString(x)].join(", ");
  } else {
    return "";
  }
}

export const displayDec = pair => {
  if (pair instanceof Array && pair.length === 2) {
    const [px, py] = pair;
    return [py, px].join(", ");
  } else {
    return "";
  }
}

const showGeoLoc = (data, callback) => {
  if (data.coords) {
    callback(data.coords);
  }
}

const handleGeoLocError = () => {
  //
}

export const fetchGeo = (callback) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(data => showGeoLoc(data, callback), handleGeoLocError);
  }
}

export const toISOUtcDateString = (dtStr = "") => {
  if (typeof dtStr === "string") {
    return dtStr.trim().replace(/\s+/, "T").replace(/(:[0-5]\d)$/, "$1.000Z");
  } else {
    return dtStr;
  }
  
}