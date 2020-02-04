<template>
  <section class="below">
    <ul v-if="hasSurrounding" class="plain tabs">
      <li
        v-for="(tab, ti) in displayTabs"
        :key="['tab', ti].join('-')"
        @click="selectTab(tab)"
        :class="tabClasses(tab)"
      >
        {{ tab.label }}
      </li>
    </ul>
    <div v-if="selectedTab === 'nearby'" class="pane pc-pane">
      <ul v-if="hasSurrounding" class="plain horizontal surrounding">
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
        <li v-for="(addr, ai) in addresses" :key="['address', ai].join('-')">
          {{ addr }}
        </li>
      </ul>
    </div>
    <div v-if="selectedTab === 'weather'" class="pane weather-pane">
      <dl v-if="hasWeather" class="flex-rows weather">
        <dt>
          Temperature:
        </dt>
        <dd>
          {{ weather.temperature }}
        </dd>
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
import { weatherSchema } from "../api/schemas";
import WikiEntry from "./WikiEntry";

export default {
  name: "DetailPanes",
  components: {
    WikiEntry
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
          label: "Nearby postcodes"
        },
        {
          key: "addresses",
          label: "Find addresses"
        },
        {
          key: "weather",
          label: "Weather"
        },
        {
          key: "wikipedia",
          label: "Wikipedia"
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
      return this.surrounding.length > 0;
    },
    hasOtherSelected() {
      return this.surrounding.filter(z => z.pc === this.zone.pc).length > 0;
    },
    hasWeather() {
      let valid = false;
      if (this.weather instanceof Object) {
        if (this.weather.stationName) {
          valid = this.weather.stationName.length > 1;
        }
      }
      return valid;
    },
    hasWikiEntries() {
      return this.wikipedia.length > 0;
    },
    hasPoi() {
      return this.poi.length > 0;
    },
    hasDate() {
      if (this.hasWeather) {
        if (/^\d\d\d\d-\d\d?-\d\d?/.test(this.weather.datetime)) {
          return true;
        }
      }
      return false;
    },
    datetime() {
      let dt = new Date();
      if (this.hasWeather) {
        if (this.hasDate) {
          dt = new Date(this.weather.datetime);
        }
      }
      return dt;
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
      return toDistUnits(vl);
    },
    selectZone(zone) {
      this.$parent.selectZone(zone);
    }
  }
};
</script>
