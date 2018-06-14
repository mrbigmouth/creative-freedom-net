import Vue from 'vue';
import Vuex from 'vuex';
// import node from '@/store/node';
import panel from '@/store/panel';

Vue.use(Vuex);

export default new Vuex.Store({
  namespaced: true,
  strict: DEVELOP_MODE,
  modules: {
    // node,
    panel,
  },
});
