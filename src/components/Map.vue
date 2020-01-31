<template>
  <div class="map-container">
    <vl-map
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      data-projection="EPSG:4326"
      @click="handleClick"
    >
      <vl-view
        :zoom.sync="zoom"
        :center.sync="center"
        :rotation.sync="rotation"
      ></vl-view>
      <vl-feature v-if="showSelected">
        <vl-style-box>
          <vl-geom-point :coordinates="selected"></vl-geom-point>
          <vl-style-circle :radius="zoomInt">
            <vl-style-fill color="rgba(255,255,255,0.5)"></vl-style-fill>
          </vl-style-circle>
        </vl-style-box>
        <vl-overlay id="overlay" :position="selected">
          <template>
            <div class="overlay-content">
              <p class="coordinates">{{ selected | showDMS }}</p>
              <p class="postcode">{{ zone.pc }}</p>
              <p class="locality">{{ zone | toLocale }}</p>
              <p class="country">{{ zone.c }}</p>
            </div>
          </template>
        </vl-overlay>
      </vl-feature>
      <vl-geoloc @update:position="geolocPosition = $event">
        <template slot-scope="geoloc">
          <vl-feature v-if="geoloc.position" id="position-feature">
            <vl-geom-circle :coordinates="center" :radius="30"></vl-geom-circle>
          </vl-feature>
        </template>
      </vl-geoloc>

      <vl-layer-tile id="osm">
        <vl-source-osm></vl-source-osm>
      </vl-layer-tile>
    </vl-map>
    <div class="details">
      <p>
        <label>Zoom</label
        ><input type="range" v-model="zoomVal" min="6" max="21" step="1" />
        <strong class="value">{{ zoomInt }}</strong>
      </p>
      <p>
        <label>Rotation</label
        ><input
          type="range"
          v-model="rotateDegrees"
          min="-180"
          max="180"
          step="15"
        />
        <strong class="value">{{ rotateDegrees }}</strong>
      </p>
      <p>
        <span class="text">Location: </span>
        <strong class="value" :title="geolocPosition">{{
          center | showDMS
        }}</strong>
      </p>
    </div>
    <section class="below">
      <ul v-if="hasSurrounding" class="plain horizontal surrounding">
        <li
          v-for="(z, zi) in surrounding"
          :key="['surrounding', zi].join('-')"
          @click="selectZone(z)"
        >
          <strong>{{ z.pc }}</strong>
          <em>{{ toDistUnits(z.dist) }}</em>
        </li>
      </ul>
      <ul v-if="hasAddresses" class="plain columns addresses">
        <li v-for="(addr, ai) in addresses" :key="['address', ai].join('-')">
          {{ addr }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import {
  deg2rad,
  calcDegreesPerKm,
  getDistanceFromCoordsInKm,
  displayDMS,
  displayDec,
  fetchGeo
} from "../lib/helpers";
import { fetchNearest, fetchAddresses } from "../api/fetch";

export default {
  name: "Map",
  props: {
    msg: String
  },
  data() {
    return {
      zoomVal: 15,
      zoom: 15,
      center: [-3.2, 56.2],
      selected: [-3.2, 56.2],
      zone: {
        pc: "",
        lat: 0,
        lng: 0,
        addresses: []
      },
      surrounding: [],
      rotateDegrees: 0,
      geolocPosition: undefined,
      dotOffsets: [0.001, 0.001]
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
      return this.zone.pc.length > 3;
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
    hasAddresses() {
      return this.addresses.length > 0;
    },
    hasSurrounding() {
      return this.surrounding.length > 0;
    },
    showSelected() {
      let v = false;
      if (this.selected) {
        if (this.selected.length == 2 && this.center.length == 2) {
          const [cx, cy] = this.center;
          const [sx, sy] = this.selected;
          if (this.zoomInt > 8) {
            const hm = 1 / (Math.pow(this.zoomInt - 8, 2) / 20); // hectametres tolerance
            const [dx, dy] = this.dotOffsets.map(v => v * hm);
            v = Math.abs(cx - sx) > dx || Math.abs(cy - sy) > dy;
          }
        }
      }
      return v;
    }
  },
  filters: {
    showDMS(val) {
      return displayDMS(val);
    },
    showDec(val) {
      return displayDec(val);
    },
    toLocale(val) {
      let parts = [];
      if (val instanceof Object) {
        if (val.w) {
          if (val.w.length > 1) {
            parts.push(val.w);
          }
        }
        if (val.cy) {
          if (val.cy.length > 1) {
            parts.push(val.cy);
          }
        }
      }
      return parts.join(", ");
    }
  },
  watch: {
    zoomVal(cv, pv) {
      const cz = parseInt(cv);
      if (cz !== parseInt(pv)) {
        this.zoom = cz;
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
      if (e.coordinate) {
        if (e.coordinate.length === 2) {
          const [lng, lat] = e.coordinate;
          this.setSelected(lat, lng);
        }
      }
    },
    displayGeoLoc(pair) {
      return displayDMS(pair);
    },
    toDistUnits(km) {
      let str = "";
      const fv = parseFloat(km);
      if (!isNaN(fv)) {
        str = Math.round(fv * 1000) + "m";
      }
      return str;
    },
    matchNearest(params) {
      let data = { matched: false, zone: { pc: "" } };
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
      this.zone.pc = "";
      this.zone.addresses = [];
      const nearest = this.matchNearest(params);
      if (nearest.matched) {
        this.setZone(nearest.zone);
      } else {
        fetchNearest(params).then(d => {
          if (d.valid) {
            if (d.zone.pc) {
              this.setZone(d.zone);
              if (d.surrounding instanceof Array) {
                if (d.surrounding.length > 0) {
                  this.surrounding = d.surrounding;
                }
              }
            }
          }
        });
      }
    },
    selectZone(zone) {
      if (zone instanceof Object) {
        this.selected = [zone.lng, zone.lat];
        this.setZone(zone);
      }
    },
    setZone(zone) {
      if (zone.pc.length > 3) {
        this.zone = zone;
        setTimeout(() => {
          if (!this.hasAddresses) {
            const { pc } = this.zone;
            fetchAddresses({ pc }).then(d2 => {
              if (d2.matched) {
                if (d2.zone.addresses instanceof Array) {
                  this.zone.addresses = d2.zone.addresses;
                }
              }
            });
          }
        }, 500);
      }
    }
  }
};
</script>
