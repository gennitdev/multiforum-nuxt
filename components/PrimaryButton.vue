<script setup lang="ts">
import LoadingSpinner from "@/components/LoadingSpinner.vue";

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-300 dark:bg-gray-800 dark:text-gray-300'
        : ' bg-blue-400 text-black hover:bg-gray-200 dark:border dark:border-blue-600 dark:bg-blue-500 dark:text-black dark:hover:bg-blue-400',
      '',
    ]"
    class="max-height-4 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
  >
    <LoadingSpinner
      v-if="loading"
      class="mx-2"
    /><slot />{{ label }}
  </button>
</template>
