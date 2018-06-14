<template>
  <div>
    <div class="container-fluid mb-3">
      <ul class="mt-1 nav nav-tabs card-header-tabs">
        <li
          v-for="panel of panelList"
          :key="panel.id"
          class="nav-item"
        >
          <a
            :class="['nav-link', isPanelActive(panel.id) ? 'active' : '']"
            href="#"
            @click.self.prevent="activePanel(panel.id)"
          >
            {{ panel.title }}
            <i
              v-if="panel.showCloseIcon"
              class="fa fa-window-close text-danger d-inline-block ml-1"
              aria-hidden="true"
              @click.stop.prevent="sendClosingSignal(panel.id)"
            />
          </a>
        </li>
      </ul>
    </div>
    <component
      v-for="panel of panelList"
      :key="panel.id"
      :is="panel.panelType"
      :panel="panel"
      :class="[isPanelActive(panel.id) ? '' : 'd-none']"
    />
  </div>

</template>

<script>
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { mapState, mapGetters, mapMutations } from 'vuex';
import UserPanel from '@/components/panel/user/UserPanel.vue';

export default {
  name: 'Layout',
  components: {
    UserPanel,
  },
  computed: {
    ...mapState('panel', ['panelList']),
    ...mapGetters('panel', ['isPanelActive']),
  },
  methods: {
    ...mapMutations('panel', [
      'activePanel',
      'sendClosingSignal',
    ]),
  },
};
</script>

<style scoped>
  .nav-item i {
    position: relative;
    left: 5px;
  }
</style>
