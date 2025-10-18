<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import TagPicker from '@/components/TagPicker.vue';
import Tag from '@/components/TagComponent.vue';

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
  canEdit: {
    type: Boolean,
    required: true,
  },
  onTagClick: {
    type: Function as PropType<(tag: string) => void>,
    default: null,
  },
});

const emit = defineEmits(['save', 'cancel']);

const isEditingTags = ref(false);
const selectedTags = ref<string[]>([]);

const startEditingTags = () => {
  selectedTags.value = [...props.existingTags];
  isEditingTags.value = true;
};

const cancelEditingTags = () => {
  isEditingTags.value = false;
  selectedTags.value = [];
};

const saveTags = () => {
  emit('save', selectedTags.value);
};

const updateSelectedTags = (tags: string[]) => {
  selectedTags.value = tags;
};

const showTagsSection = computed(() => {
  return props.existingTags.length > 0 || props.canEdit;
});
</script>

<template>
  <div v-if="showTagsSection">
    <div class="flex items-center justify-between">
      <button
        v-if="canEdit && !isEditingTags"
        class="text-xs text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
        @click="startEditingTags"
      >
        <i class="fa-solid fa-pen-to-square mr-1" />
        Edit tags
      </button>
    </div>

    <!-- View Mode -->
    <div v-if="!isEditingTags" class="mt-2 flex flex-wrap gap-2">
      <Tag
        v-for="tag in existingTags"
        :key="tag"
        class="mb-1"
        :tag="tag"
        @click="onTagClick ? onTagClick(tag) : null"
      />
      <p
        v-if="existingTags.length === 0 && canEdit"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        No tags yet. Click "Edit tags" to add tags.
      </p>
    </div>

    <!-- Edit Mode -->
    <div v-else class="mt-2">
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
          @click="cancelEditingTags"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
