// import Vue from 'vue';
// // import request from 'lib/request';
// import { check, patterns } from '@/utils/check';
// import { connection } from '@/utils/connection';

// const urlRoot = connection.urlPrefix + '/kademlia';
// const nodeSchema = {
//   id: String,
//   type: patterns.oneOf('node', 'storage', 'chainMaster'),
//   address: patterns.match((value) => {
//     check(value, Array);
//     check(value.length, 2);
//     check(value[0], String);
//     check(value[1], patterns.oneOf(String, Number));

//     return true;
//   }),
// };
// const nodeKeys = Object.keys(nodeSchema);
// export default {
//   namespaced: true,
//   state: {
//     current: connection.nodeId,
//     hash: {},
//   },
//   mutations: {
//     set(state, payload) {
//       check(payload, stateSchema);
//       Vue.set(state.hash, payload.id, payload);
//     },
//   },
//   actions: {
//     load({ commit, state }, payload) {
//       const { address } = state;
//       request({
//         method: 'get',
//         url: urlRoot,
//         responseType: 'json',
//       })
//         .then((result) => {
//           commit('set', result);
//         })
//         .catch((error) => {
//         });
//     },
//   },
// };
