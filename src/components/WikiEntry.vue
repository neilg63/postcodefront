<template>
  <article class="entry">
    <h4>
      <a :href="href" ref="external" target="_blank">{{ title }}</a>
      <em>({{ displayDistance }})</em>
    </h4>
    <p v-if="hasSummary">
      <span class="text" v-html="summary"></span>
      <a :href="href" ref="external" target="_blank">...more</a>
    </p>
  </article>
</template>
<script>
import { wikipediaSchema } from "../api/schemas";
import { toDistUnits } from "../lib/helpers";
export default {
  name: "WikiEntry",
  props: {
    entry: {
      type: Object,
      default() {
        return wikipediaSchema;
      }
    }
  },
  computed: {
    summary() {
      let str = "";
      if (this.entry.summary) {
        str = this.entry.summary.replace(/\(\.\.+\)\s*$/, "");
      }
      return str;
    },
    href() {
      let href = "";
      if (this.entry.wikipediaUrl) {
        href = this.toHref(this.entry.wikipediaUrl);
      }
      return href;
    },
    hasSummary() {
      return this.summary.length > 8;
    },
    title() {
      let str = "";
      if (this.entry.title) {
        str = this.entry.title.trim();
      }
      return str;
    },
    displayDistance() {
      let str = "";
      if (this.entry.distance) {
        str = toDistUnits(this.entry.distance);
      }
      return str;
    }
  },
  methods: {
    toHref(wikiRef) {
      let u = "";
      if (typeof wikiRef === "string") {
        u = "https://" + wikiRef;
      }
      return u;
    }
  }
};
</script>
