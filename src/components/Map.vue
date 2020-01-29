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
          <vl-style-text
            :text="selected | showDMS"
            font="1em monospace"
          ></vl-style-text>
        </vl-style-box>
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
        <strong class="value">{{ center | showDMS }}</strong>
      </p>
      <p>
        <span class="text">Coordinates: </span>
        <em>{{ geolocPosition }}</em>
      </p>
    </div>
  </div>
</template>

<script>
import {
  deg2rad,
  calcDegreesPerKm,
  displayDMS,
  fetchGeo
} from "../lib/helpers";

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
    },
    setOffsets() {
      const [lng, lat] = this.center;
      const kms = calcDegreesPerKm({ lat, lng });
      this.dotOffsets = [kms.x / 10, kms.y / 10];
    },
    handleClick(e) {
      if (e.coordinate) {
        this.selected = e.coordinate;
      }
    },
    displayGeoLoc(pair) {
      return displayDMS(pair);
    }
  }
};
</script>
