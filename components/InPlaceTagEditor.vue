<script lang="ts" setup>
import { ref } from 'vue';
import type { PropType } from 'vue';
import TagPicker from '@/components/TagPicker.vue';

const props = defineProps({
  existingTags: {
    type: Array as PropType<string[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['save', 'cancel']);

const selectedTags = ref<string[]>([...props.existingTags]);

const saveTags = () => {
  emit('save', selectedTags.value);
};

const cancelEditing = () => {
  emit('cancel');
};

const updateSelectedTags = (tags: string[]) => {
  selectedTags.value = tags;
};
</script>

<template>
  <div class="mt-2">
    <TagPicker
      :selected-tags="selectedTags"
      description=""
      @set-selected-tags="updateSelectedTags"
    />

    <!-- Error Message -->
    <div
      v-if="error"
      class="mt-2 text-sm text-red-500 dark:text-red-400"
    >
      Failed to save tags: {{ error }}
    </div>

    <!-- Action Buttons -->
    <div class="mt-3 flex gap-2">
      <button
        class="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        :disabled="loading"
        @click="saveTags"
      >
        {{ loading ? 'Saving...' : 'Save' }}
      </button>
      <button
        class="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        :disabled="loading"
        @click="cancelEditing"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
