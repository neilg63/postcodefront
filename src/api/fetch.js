import axios from "axios";
import { config } from '../.env';

export const postRequest = async (method, params) => {
  const { apiUrl, headers } = config;
  let data = { valid: false };
  await axios
    .post(apiUrl + "/" + method, params, {
      headers
    })
    .then(response => {
      if (response.data) {
        if (response.data instanceof Object || response.data instanceof Array) {
          data = response.data;
        }
      }
    }).catch(e => {
      data.error = e;
    });
  return data;
}

export const fetchNearest = async (params) => {
  return await postRequest("geo-codes", params);
}

export const fetchSurrounding = async (pc) => {
  return await postRequest("pc-match", { pc });
}

export const fetchAddresses = async (pc) => {
  return await postRequest("addresses", { pc });
}