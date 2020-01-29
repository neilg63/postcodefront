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
  }
};
</script>
<style lang="scss">
@import "./styles/app.scss";
</style>
