import { mapMutations } from 'vuex';
import { check, patterns } from 'lib/check';

export default {
  name: 'basicPanel',
  props: {
    panel: {
      validator(value) {
        check(value, {
          id: String,
          panelType: String,
          title: String,
          showCloseIcon: Boolean,
          closingSignal: Boolean,
          data: patterns.optional(Object),
        });

        return true;
      },
      required: true,
    },
  },
  watch: {
    'panel.closingSignal': function(closingSignal) {
      if (closingSignal) {
        this.$handleClosingSignal();
      }
    },
  },
  methods: {
    ...mapMutations('panel', ['closePanel']),
    $handleClosingSignal() {
      this.closePanel(this.panel.id);
    },
  },
};
