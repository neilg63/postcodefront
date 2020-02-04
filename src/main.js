import Vue from 'vue'
import VueLayers from 'vuelayers'
import Storage from 'vue-ls';
import 'vuelayers/lib/style.css' // needs css-loader
import App from './App.vue'
import VueFilterDateFormat from 'vue-filter-date-format';

Vue.use(VueFilterDateFormat);

const options = {
  namespace: 'mw__',
  name: 'ls',
  storage: 'local',
};

Vue.use(Storage, options);

Vue.use(VueLayers, {
  dataProjection: 'EPSG:4326',
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
