<template>
  <article class="entry">
    <p>
      <span class="text" v-html="summary"></span>
      <a :href="href" ref="external" target="_blank">...more</a>
    </p>
  </article>
</template>
<script>
import { wikipediaSchema } from "../api/schemas";

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
