<template>
  <div id="app">
    <Map msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import Map from "./components/Map.vue";

export default {
  name: "app",
  components: {
    Map
  },
  created() {
    this.deleteExcessStorage();
  },
  methods: {
    deleteExcessStorage() {
      const numLsItems = localStorage.length;
      const max = 50;
      if (numLsItems > 4) {
        let items = [];

        Object.keys(localStorage).forEach(key => {
          if (key.indexOf("mw__") === 0) {
            const raw = localStorage.getItem(key);
            if (typeof raw === "string") {
              const d = JSON.parse(raw);
              if (d.expire) {
                items.push({
                  ts: d.expire,
                  key: key.replace(/^mw__/, "")
                });
              }
            }
          }
        });
        items.sort((a, b) => b.ts - a.ts);
        if (items.length > max) {
          for (let i = max; i < items.length; i++) {
            this.$ls.remove(items[i].key);
          }
        }
      }
    }
  }
};
</script>
<style lang="scss">
@import "./styles/app.scss";
</style>
