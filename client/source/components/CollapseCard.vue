<template>
  <div class="card">
    <div
      class="card-header"
      @click="toggle"
    >
      <h5 class="mb-0">
        <slot name="title" />
        <i
          :class="['fa', collapse ? 'fa-folder' : 'fa-folder-open']"
          aria-hidden="true"
        />
      </h5>
    </div>
    <div :class="['collapse', collapse ? '' : 'show']">
      <div class="card-body">
        <slot name="body" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CollapseCard',
  props: {
    initialCollapse: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      collapse: this.initialCollapse,
    };
  },
  methods: {
    toggle() {
      this.collapse = !this.collapse;
    },
  },
};
</script>

<style scoped>
  .card-header {
    cursor: pointer;
  }
</style>
