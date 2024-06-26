<template>
  <section class="map-container" :class="wrapperClasses">
    <div class="controls">
      <div class="item">
        <input
          type="text"
          v-model="search"
          size="10"
          maxlength="32"
          placeholder="UK postcode or town/city around the world"
          class="textfield search"
          @keyup.enter="fetchByPc"
          @keydown="checkSuggestions"
        />

        <div class="suggestions" :class="suggestionsClasses">
          <ul v-if="hasSuggestions">
            <li v-for="(row, ri) in suggestions" :key="['sug', ri].join('-')" @click="goToNearest(row)">{{ row.text }}</li>
          </ul>
        </div>
      </div>
      <p class="zoom-level">
        <label>Zoom</label>
        <input type="range" v-model="zoomVal" min="6" max="23" step="1" />
        <strong class="value">{{ zoomInt }}</strong>
      </p>
      <p v-if="showRotation">
        <label>Rotation</label>
        <input type="range" v-model="rotateDegrees" min="-180" max="180" step="15" />
        <strong class="value">{{ rotateDegrees }}</strong>
      </p>
      <p class="coordinates">
        <strong class="value" :title="center | showDec">
          {{
          center | showDMS
          }}
        </strong>
      </p>
      <p class="logo">
        <a href="https://www.multifaceted.info" target="_blank"></a>
      </p>
    </div>
    <vl-map
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      data-projection="EPSG:4326"
      @click="handleClick"
    >
      <vl-view :zoom.sync="zoom" :center.sync="center" :rotation.sync="rotation"></vl-view>
      <vl-feature v-if="showSelected">
        <vl-style-box>
          <vl-geom-point :coordinates="selected"></vl-geom-point>
          <vl-style-icon src="/images/pin.svg" :anchor="[0.5, 1]" :scale="markerScale"></vl-style-icon>
        </vl-style-box>
        <vl-overlay id="overlay" :position="selected">
          <template>
            <div class="overlay-content">
              <div class="coordinates">
                <i class="icon-compass"></i>
                <p class="lat">{{ selected | showLatDMS }}</p>
                <p class="lng">{{ selected | showLngDMS }}</p>
              </div>
              <p class="hasZonePlace">{{ zonePlace }}</p>
              <p class="postcode">{{ zone.pc }}</p>
              <p class="locality">{{ zone | toLocale }}</p>
              <p class="country">{{ zone.c }}</p>
            </div>
          </template>
        </vl-overlay>
      </vl-feature>

      <vl-layer-tile id="osm">
        <vl-source-osm></vl-source-osm>
      </vl-layer-tile>
    </vl-map>

    <detail-panes
      :zone="zone"
      :surrounding="surroundingZones"
      :poi="poi"
      :weather="weather"
      :wikipedia="wikipedia"
      :geonames="geonames"
    />
    <div class="loading-overlay" :class="loadingClasses">
      <img src="/images/spinning-wheel.svg" height="160" width="160" />
    </div>
  </section>
</template>

<script>
import {
  deg2rad,
  calcDegreesPerKm,
  getDistanceFromCoordsInKm,
  displayDMS,
  displayDec,
  fetchGeo,
  isNumeric,
  cleanString,
  validUKPostcode,
  isApprox
} from "../lib/helpers";
import { fetchNearest, fetchSugegstions, fetchSurrounding } from "../api/fetch";
import DetailPanes from "./DetailPanes";
import { weatherSchema, zoneSchema } from "../api/schemas";
import { defaultCoords } from "../.env";

export default {
  name: "Map",
  components: {
    DetailPanes
  },
  data() {
    return {
      zoomVal: 15,
      zoom: 15,
      center: [defaultCoords.lng, defaultCoords.lat],
      selected: [defaultCoords.lng, defaultCoords.lat],
      zone: zoneSchema,
      zonePlace: "",
      surrounding: [],
      geonames: [],
      weather: weatherSchema,
      poi: [],
      wikipedia: [],
      rotateDegrees: 0,
      geolocPosition: undefined,
      dotOffsets: [0.001, 0.001],
      showRotation: false,
      search: "",
      units: {
        degrees: "dms",
        distance: "m"
      },
      suggestions: [],
      loading: false,
    };
  },
  computed: {
    rotation() {
      return deg2rad(this.rotateDegrees);
    },
    markerRadius() {
      return this.zoom * 1.5;
    },
    zoomInt() {
      return parseInt(this.zoom);
    },
    hasZone() {
      return this.zone.pc.length > 1 || this.zone.pn.length > 1;
    },
    hasZonePlace() {
      return this.zonePlace.trim().length > 1;
    },
    addresses() {
      let items = [];
      if (this.hasZone) {
        if (this.zone.addresses) {
          if (this.zone.addresses instanceof Array) {
            items = this.zone.addresses;
          }
        }
      }
      return items;
    },
    markerScale() {
      if (this.zoomInt < 16) {
        return 1;
      } else {
        return 1 * Math.pow(this.zoomInt - 16, 0.5);
      }
    },
    hasAddresses() {
      return this.addresses.length > 0;
    },
    hasSurrounding() {
      return this.surrounding.length > 0;
    },
    surroundingZones() {
      if (this.surrounding.filter(z => z.pc === this.zone.pc).length < 1) {
        return [this.zone, ...this.surrounding];
      } else {
        return this.surrounding;
      }
    },
    showSelected() {
      let v = false;
      if (this.selected) {
        if (this.selected.length == 2 && this.center.length == 2) {
          const [sx, sy] = this.selected;
          if (isNumeric(sx) && isNumeric(sy)) {
            if (this.zoomInt > 10) {
              v = this.hasZone;
            }
          }
        }
      }
      return v;
    },
    wrapperClasses() {
      let cls = ["zoom-" + this.zoomInt];
      return cls;
    },
    hasSuggestions() {
      return this.suggestions.length > 0 && this.suggestions[0] instanceof Object;
    },
    suggestionsClasses() {
      return this.hasSuggestions ? ['show'] : ['hide'];
    },
    loadingClasses() {
      return this.loading ? ['loading'] : ['not-loading'];
    }
  },
  filters: {
    showDMS(val) {
      return displayDMS(val);
    },
    showLatDMS(val) {
      return displayDMS(val)
        .split(",")
        .shift()
        .trim();
    },
    showLngDMS(val) {
      return displayDMS(val)
        .split(",")
        .pop()
        .trim();
    },
    showDec(val) {
      return displayDec(val);
    },
    toLocale(val) {
      let parts = [];
      if (val instanceof Object) {
        if (!val.w) {
          val.w = "";
        }
        if (val.pn) {
          if (val.pn.length > 1) {
            parts.push(val.pn);
          }
        } else {
          val.pn = "";
        }
        const cleanedW = cleanString(val.w);
        const cleanedPn = cleanString(val.pn);
        if (val.w) {
          if (
            val.w.length > 1 &&
            cleanedW !== cleanedPn &&
            cleanedW.indexOf(cleanedPn) < 0
          ) {
            parts.push(val.w);
          }
        }
        if (val.cy) {
          if (
            val.cy.length > 1 &&
            cleanString(val.cy) !== cleanString(val.pn)
          ) {
            parts.push(val.cy);
          }
        }
        if (val.r) {
          if (val.r.length > 1 && cleanString(val.r) !== cleanString(val.cy)) {
            parts.push(val.r);
          }
        }
      }
      return parts.join(", ");
    },
    searchIsPostcode() {
      let valid = false;
      if (this.search.length > 3) {
        valid = validUKPostcode(this.search);
      }
      return valid;
    }
  },
  watch: {
    zoomVal(cv, pv) {
      const cz = parseFloat(cv);
      if (cz !== parseFloat(pv)) {
        this.zoom = parseInt(cz);
      }
    },
    zoom(cv, pv) {
      const cz = parseFloat(cv);
      if (cz !== parseFloat(pv)) {
        this.zoomVal = parseInt(cz);
      }
    },
    center(cv, pv) {
      if (cv !== pv) {
        this.setOffsets();
      }
    }
  },
  created() {
    this.setOffsets();
    fetchGeo(coords => {
      if (coords instanceof Object) {
        this.setCenter(coords.latitude, coords.longitude);
        this.setSelected(coords.latitude, coords.longitude);
        setTimeout(() => {
          this.zoomVal = 18;
        }, 3000);
      }
    });
  },
  methods: {
    setCenter(lat, lng) {
      this.center = [lng, lat];
    },
    setSelected(lat, lng) {
      this.selected = [lng, lat];
      this.fetchZones();
    },
    setOffsets() {
      const [lng, lat] = this.center;
      const kms = calcDegreesPerKm({ lat, lng });
      this.dotOffsets = [kms.x / 10, kms.y / 10];
    },
    handleClick(e) {
      if (e.coordinate && this.zoomInt > 10) {
        if (e.coordinate.length === 2) {
          const [lng, lat] = e.coordinate;
          this.setSelected(lat, lng);
        }
      }
    },
    displayGeoLoc(pair) {
      return displayDMS(pair);
    },
    matchNearest(params) {
      let data = { matched: false, zone: zoneSchema };
      if (this.surrounding.length > 0) {
        const nz = this.surrounding
          .map(z => {
            z.dist = getDistanceFromCoordsInKm(z, params);
            return z;
          })
          .filter(z => z.dist < 0.1);
        if (nz.length > 0) {
          nz.sort((a, b) => a.dist - b.dist);
          if (nz[0].dist < 0.02) {
            data.zone = nz[0];
            data.matched = true;
          }
        }
      }
      return data;
    },
    fetchZones() {
      const [lng, lat] = this.selected;
      const params = { lng, lat };
      this.findZoneData(params);
    },
    isUK() {
      const { c, lat, lng, n } = this.zone;
      if (typeof c === 'string' && c.length > 0 && lat !== 0 && lng !== 0 && lat !== undefined) {
        return typeof n === 'number' && n > 0;
      } else {
        const [x, y] = this.selected;
        return (x > -10 && x < 3 && y > 49.4 && y < 61 )
      }
      
    },
    findZoneData(coords) {
      this.zonePlace = "";
      this.zone = zoneSchema;
      const nearest = this.matchNearest(coords);
      if (nearest.matched) {
        this.setZone(nearest.zone);
      } else {
        const { lng, lat } = coords;
        if (coords.name) {
          this.zonePlace = coords.name;
        }
        const ck =
          "near_" + parseFloat(lat).toFixed(6) + parseFloat(lng).toFixed(6);
        const data = this.$ls.get(ck);
        if (data instanceof Object) {
          this.handleZoneData(data);
        } else {
          fetchNearest(coords).then(d => {
            this.handleZoneData(d, false, ck);
          });
        }
      }
    },
    goToNearest(item) {
     if (item instanceof Object) {
      this.loading = true;
      this.suggestions = [];
      const { lat, lng } = item;
      const ck =
        "near_" + parseFloat(lat).toFixed(6) + parseFloat(lng).toFixed(6);
      fetchNearest(item).then(d => {
        this.handleZoneData(d,true, ck);
      });
     }
    },
    getSuggestions() {
      const str = this.search.trim();
      if (str.length > 1) {
        const ck = `sug_${str.toLowerCase()}`;
        const data = this.$ls.get(ck);
        if (data instanceof Array && data.length > 0) {
          this.suggestions = data;
        } else {
          fetchSugegstions(this.search).then(result => {
            if (result instanceof Array) {
              const num = result.length;
              if (num === 1) {
                const { lat, lng } = result[0];
                if (typeof lat === 'number' && typeof lng === 'number') {
                  const [x, y] = this.selected;
                  const isSame = isApprox(y, lat) && isApprox(x, lng);
                  if (!isSame) {
                    this.goToNearest(result[0]);
                  }
                }
                
              } else if (num > 1) {
                this.suggestions = result;
                this.$ls.set(ck, result, 3 * 24 * 3600 * 1000);
              }
            }
          })
        }
      }
    },
    fetchByPc() {
      this.suggestions = [];
      if (this.search.length > 2) {
        this.zonePlace = "";
        this.zone = zoneSchema;
        const pc = this.search.trim().toUpperCase();
        if (this.isUK() && this.search.length > 4 && validUKPostcode(pc) && pc !== this.zone.pc.trim().toUpperCase()) {
          const ck = "pc_" + pc.replace(/\s/, "_");
          const data = this.$ls.get(ck);
          this.loading = true;
          if (data instanceof Object && data.valid) {
            this.handleZoneData(data, true);
          } else {
            fetchSurrounding(pc).then(d => {
              this.handleZoneData(d, true, ck);
            });
          }
        } else {
          this.getSuggestions();
        }
      }
    },
    checkSuggestions(e) {
      if (e.key) {
        const key = e.key.toLowerCase();
        if (['enter', 'meta', 'arrowleft','arrowright', 'arrowup', 'arrowdown'].includes(key) === false) {
          if (this.search.length > 1 && !validUKPostcode(this.search) && !/^[A-Z][A-Z0-9]+/.test(this.search)) {
            this.getSuggestions();
          } else {
            this.suggestions = [];
          }
        }
      }
    },
    handleZoneData(d, recenter, ck) {
      this.loading = false;
      if (d instanceof Object) {
        this.zone = zoneSchema;
        this.geonames = [];
        this.poi = [];
        this.wikipedia = [];
        this.weather = weatherSchema;
        if (d.valid) {
          if (!d.zone.pc) {
            d.zone.pc = "";
          }
          if (d.surrounding instanceof Array) {
            if (d.surrounding.length > 0) {
              this.surrounding = d.surrounding;
            }
          }
          if (d.hasWeather) {
            if (this.weather instanceof Object) {
              this.weather = d.weather;
            }
          }
          if (d.hasPoi) {
            this.poi = d.poi;
          }
          if (!d.states) {
            d.states = [];
          }
          if (d.states.length > 0) {
            this.geonames = d.states.map(gn => {
              gn.type = "s";
              return gn;
            });
          }
          if (d.places.length > 0) {
            const pls = d.places.map(gn => {
              gn.type = "p";
              return gn;
            });
            this.geonames = this.geonames.concat(pls);
            if (!d.zone.cy) {
              if (d.states.length > 2) {
                d.zone.cy = d.states[2].name;
              }
            }
          }
          if (d.hasWikiEntries > 0) {
            if (d.wikipedia instanceof Array) {
              this.wikipedia = d.wikipedia
                .filter(w => {
                  let v = false;
                  if (w instanceof Object) {
                    if (w.title && w.wikipediaUrl) {
                      v = true;
                    }
                  }
                  return v;
                })
                .map(w => {
                  if (isNumeric(w.distance)) {
                    w.distance = parseFloat(w.distance);
                  }
                  return w;
                });
            }
          }
          if (!d.zone.pn) {
            d.zone.pn = "";
          }
          if (d.zone.pn.length < 1) {
            if (d.places.length > 0) {
              d.zone.pn = d.places[d.places.length - 1].name;
              d.zone.c = d.states[0].name;
              if (d.states.length > 1) {
                d.zone.r = d.states[1].name;
              }
              if (d.states.length > 2) {
                d.zone.cy = d.states[2].name;
              }
            }
          }
          this.setZone(d.zone);
          if (recenter === true) {
            const { lat, lng } = d.zone;
            this.setSelected(lat, lng);
            this.setCenter(lat, lng);
          }
          if (typeof ck === "string") {
            if (ck.length > 5) {
              this.$ls.set(ck, d, 7 * 24 * 3600 * 1000);
            }
          }
        }
      }
    },
    selectZone(zone) {
      if (zone instanceof Object) {
        const { lat, lng } = zone;
        if (isNumeric(lat) && isNumeric(lng)) {
          this.selected = [lng, lat];
          this.setZone(zone);
          this.setCenter(lat, lng);
        }
      }
    },
    setZone(zone) {
      if (zone instanceof Object && typeof zone.c === "string" && zone.c.length > 0)  {
        this.zone = zone;
      }
      if (zone.pc.length > 1 || zone.pn.length > 0) {
        const newSearch = validUKPostcode(zone.pc)? zone.pc : zone.lc;
        const oldSearch = this.search.trim();
        if (newSearch !== oldSearch) {
          this.search = newSearch;
        }
      }
    }
  }
};
</script>
