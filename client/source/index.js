import Vue from 'vue';
import { mapActions } from 'vuex';
import store from '@/store/store';
import Layout from './Layout.vue';

Vue.config.productionTip = (DEVELOP_MODE === false);
window.app = new Vue({
  el: '#app',
  store,
  components: {
    Layout,
  },
  mounted() {
    this.$nextTick(() => {
      this.loadNodeStatus();
    });
  },
  methods: {
    ...mapActions('currentNode', {
      loadNodeStatus: 'load',
    }),
  },
  template: '<Layout/>',
});
