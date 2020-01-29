import Vue from 'vue'
import VueLayers from 'vuelayers'
import 'vuelayers/lib/style.css' // needs css-loader
import App from './App.vue'

Vue.use(VueLayers, {
  dataProjection: 'EPSG:4326',
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
