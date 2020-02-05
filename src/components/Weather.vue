<template>
  <dl v-if="hasWeather" class="flex-rows weather">
    <dt>
      Temperature:
    </dt>
    <dd v-html="temperature"></dd>
    <dt>
      Humidity:
    </dt>
    <dd>
      {{ weather.humidity }}
    </dd>
    <dt>
      Station:
    </dt>
    <dd>
      {{ weather.stationName }}
    </dd>
    <dt v-if="hasDate">
      Date:
    </dt>
    <dd v-if="hasDate">
      {{ datetime | dateFormat("DD/MM/YYYY HH:mm") }}
    </dd>
  </dl>
</template>
<script>
import { weatherSchema, hasWeatherData } from "../api/schemas";
import { isNumeric } from "../lib/helpers";

export default {
  name: "Weather",
  props: {
    weather: {
      type: Object,
      default() {
        return weatherSchema;
      }
    }
  },
  computed: {
    hasDate() {
      if (this.hasWeather) {
        if (/^\d\d\d\d-\d\d?-\d\d?/.test(this.weather.datetime)) {
          return true;
        }
      }
      return false;
    },
    hasWeather() {
      return hasWeatherData(this.weather);
    },
    datetime() {
      let dt = new Date();
      if (this.hasWeather) {
        if (this.hasDate) {
          dt = new Date(this.weather.datetime);
        }
      }
      return dt;
    },
    temperature() {
      let str = "";
      const { temperature } = this.weather;
      if (isNumeric(temperature)) {
        str =
          '<span class-"value">' +
          parseInt(temperature) +
          "</span><sup>ºC</sup>";
      }
      return str;
    }
  }
};
</script>
