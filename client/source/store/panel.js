import Vue from 'vue';
import { check, patterns } from 'lib/check';

export default {
  namespaced: true,
  state: {
    activePanelId: 'mainSetting',
    panelList: [],
  },
  getters: {
    isPanelExists(state) {
      return (id) => {
        check(id, String);

        return state.panelList.some((panel) => {
          return panel.id === id;
        });
      };
    },
    isPanelActive(state) {
      return (id) => {
        check(id, String);

        return state.activePanelId === id;
      };
    },
  },
  mutations: {
    activePanel(state, id) {
      check(id, String);
      state.activePanelId = id;
    },
    sendClosingSignal(state, id) {
      check(id, String);
      const panel = state.panelList.find((panel) => {
        return id === panel.id;
      });
      if (panel) {
        Vue.set(panel, 'closingSignal', true);
      }
    },
    closePanel(state, id) {
      check(id, String);
      const index = state.panelList.findIndex((panel) => {
        return panel.id === id;
      });
      if (index !== -1) {
        state.panelList.splice(index, 1);
      }
      if (state.activePanelId === id) {
        state.activePanelId = state.panelList[0].id;
      }
    },
    createPanel(state, inputPayload) {
      check(inputPayload, {
        id: patterns.optional(String),
        panelType: String,
        title: String,
        showCloseIcon: patterns.optional(Boolean),
        automaticActiveNewPanel: patterns.optional(Boolean),
        data: patterns.optional(Object),
      });

      const panelData = {
        id: inputPayload.id || '',
        panelType: inputPayload.panelType || '',
        title: inputPayload.title,
        showCloseIcon: inputPayload.showCloseIcon || true,
        closingSignal: false,
        data: inputPayload.data || {},
      };
      // 若有設定新panel的id，檢查是否已存在
      if (panelData.id) {
        const existsPanel = state.panelList.find((panel) => {
          return panel.id === panelData.id;
        });
        // 已存在的話就不做任何事情
        if (existsPanel) {
          return false;
        }
      }
      // 否則自動決定新panel的id
      else {
        let counter = 0;
        let existsPanel = null;
        do {
          counter += 1;
          panelData.id = `${panelData.panelType}${counter}`;
          existsPanel = state.panelList.find((panel) => {
            return panel.id === panelData.id;
          });
        }
        while (existsPanel);
      }
      state.panelList.push(panelData);
      if (inputPayload.automaticActiveNewPanel !== false) {
        state.activePanelId = panelData.id;
      }

      return true;
    },
  },
};
