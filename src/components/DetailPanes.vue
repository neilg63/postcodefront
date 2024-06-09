<template>
  <section class="below">
    <ul v-if="hasSurrounding" class="plain tabs">
      <li
        v-for="(tab, ti) in displayTabs"
        :key="['tab', ti].join('-')"
        @click="selectTab(tab)"
        :class="tabClasses(tab)"
        :title="tab.description"
      >{{ tab.label }}</li>
    </ul>
    <div v-if="selectedTab === 'nearby'" class="pane pc-pane">
      <ol v-if="hasGeonames" class="plain horizontal geonames">
        <li v-for="(gn, gi) in ascGeonames" :key="['geoname', gi].join('-')">{{ gn.name }}</li>
      </ol>
      <ul v-if="hasPoi" class="plain horizontal points-of-interest">
        <li v-for="(p, pi) in filteredPoi" :key="['poi', pi].join('-')" @click="selectCoords(p)">
          <span class="text">{{ p.name }}</span>
          <em>{{ toDistUnitsFromKm(p.distance) }}</em>
        </li>
      </ul>
      <ul v-if="hasOtherPcs" class="plain horizontal surrounding">
        <li
          v-for="(z, zi) in surrounding"
          :key="['surrounding', zi].join('-')"
          @click="selectZone(z)"
          :class="nearbyClasses(z)"
        >
          <strong>{{ z.pc }}</strong>
          <em>{{ toDistUnits(z.dist) }}</em>
        </li>
      </ul>
    </div>
    <div v-if="selectedTab === 'addresses'" class="pane address-pane">
      <ul v-if="hasAddresses" class="plain columns addresses">
        <li v-for="(addr, ai) in addresses" :key="['address', ai].join('-')">{{ addr }}</li>
      </ul>
    </div>
    <div v-if="selectedTab === 'weather'" class="pane weather-pane">
      <weather :weather="weather" />
    </div>
    <div v-if="selectedTab === 'wikipedia'" class="pane wikipedia-pane">
      <div v-if="hasWikiEntries" class="wikipedia-entries">
        <template v-for="(entry, ei) in wikipedia">
          <wiki-entry :entry="entry" :key="['wiki', ei].join('-')" />
        </template>
      </div>
    </div>
  </section>
</template>
<script>
import { toDistUnits } from "../lib/helpers";
import { weatherSchema, hasWeatherData } from "../api/schemas";
import { isNumeric } from "../lib/helpers";
import WikiEntry from "./WikiEntry";
import Weather from "./Weather";

export default {
  name: "DetailPanes",
  components: {
    WikiEntry,
    Weather
  },
  props: {
    zone: {
      type: Object,
      default() {
        return {
          pc: "",
          lat: 0,
          lng: 0,
          addresses: []
        };
      }
    },
    surrounding: {
      type: Array,
      default() {
        return [];
      }
    },
    weather: {
      type: Object,
      default() {
        return weatherSchema;
      }
    },
    wikipedia: {
      type: Array,
      default() {
        return [];
      }
    },
    geonames: {
      type: Array,
      default() {
        return [];
      }
    },
    poi: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      tabs: [
        {
          key: "nearby",
          label: "Nearby",
          description: "Toponyms and nearby postcodes (where available)"
        },
        {
          key: "addresses",
          label: "Addresses",
          description: "Addresses in this postcode area (where available)"
        },
        {
          key: "weather",
          label: "Weather",
          description: "Latest available nearby weather data"
        },
        {
          key: "wikipedia",
          label: "More info",
          description: "Points of interest and wikipedia articles"
        }
      ],
      selectedTab: "nearby"
    };
  },
  computed: {
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
    displayTabs() {
      return this.tabs.filter(t => {
        let valid = true;
        switch (t.key) {
          case "nearby":
            valid = this.hasSurrounding;
            break;
          case "weather":
            valid = this.hasWeather;
            break;
          case "addresses":
            valid = this.hasAddresses;
            break;
          case "wikipedia":
            valid = this.hasWikiEntries;
            break;
        }
        return valid;
      });
    },
    hasAddresses() {
      return this.addresses.length > 0;
    },
    hasSurrounding() {
      return this.surrounding.length > 0 || this.geonames.length > 0;
    },
    hasGeonames() {
      return this.geonames.length > 0;
    },
    ascGeonames() {
      return this.geonames.slice(0).reverse();
    },
    hasOtherPcs() {
      return this.surrounding.length > 0;
    },
    hasOtherSelected() {
      return this.surrounding.filter(z => z.pc === this.zone.pc).length > 0;
    },
    hasWeather() {
      return hasWeatherData(this.weather);
    },
    hasWikiEntries() {
      return this.wikipedia.length > 0;
    },
    hasPoi() {
      return this.filteredPoi.length > 0;
    },
    isUK() {
      if (this.hasZone && typeof this.zone.wc === 'string') {
        return this.zone.wc.trim().length > 3;
      } else {
        return false
      }
    },
    filteredPoi() {
      return this.poi
        .filter(p => {
          let valid = false;
          if (p instanceof Object) {
            if (p.distance) {
              if (isNumeric(p.distance)) {
                if (p.name) {
                  valid = p.name.length > 1;
                }
              }
            }
          }
          return valid;
        })
        .map(p => {
          p.distance = parseFloat(p.distance);
          p.classNames = [];
          if (p.typeClass) {
            p.classNames.push(p.typeClass.replace(/_/g, "-"));
          }
          if (p.typeName) {
            p.classNames.push(p.typeName.replace(/_/g, "-"));
          }
          return p;
        });
    }
  },
  filters: {},
  methods: {
    selectTab(tab) {
      if (tab instanceof Object) {
        this.selectedTab = tab.key;
      }
    },
    nearbyClasses(zone) {
      let cls = [];
      if (zone instanceof Object) {
        if (this.zone.pc === zone.pc) {
          cls.push("active");
        }
      }
      return cls;
    },
    tabClasses(tab) {
      let cls = [tab.key];
      if (tab.key === this.selectedTab) {
        cls.push("active");
      }
      return cls;
    },
    toDistUnits(vl) {
      return toDistUnits(vl, 'm', !this.isUK);
    },
    toDistUnitsFromKm(vl) {
      return toDistUnits(vl, 'm', true);
    },
    selectZone(zone) {
      this.$parent.selectZone(zone);
    },
    selectCoords(coords) {
      this.$parent.findZoneData(coords);
    }
  }
};
</script>
