<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_TAGS } from '@/graphQLData/tag/queries';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption } from '@/components/MultiSelect.vue';
import type { Tag } from '@/__generated__/graphql';

// Props are used in template
defineProps({
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['setSelectedTags']);

const searchQuery = ref('');

const {
  loading: tagsLoading,
  result: tagsResult,
} = useQuery(
  GET_TAGS,
  computed(() => ({
    where: {
      text_CONTAINS: searchQuery.value,
    },
  })),
  {
    fetchPolicy: 'cache-and-network',
  }
);

const tagOptions = computed<MultiSelectOption[]>(() => {
  const tags = tagsResult.value?.tags || [];
  const options = tags.map((tag: Tag) => ({
    value: tag.text,
    label: tag.text,
  }));

  // Add option to create new tag if search doesn't match existing tags
  if (
    searchQuery.value &&
    !tags.some(
      (tag: Tag) => tag.text.toLowerCase() === searchQuery.value.toLowerCase()
    )
  ) {
    options.unshift({
      value: searchQuery.value,
      label: `Create "${searchQuery.value}"`,
      icon: 'fa-solid fa-plus',
    });
  }

  return options;
});

const handleUpdateTags = (newTags: string[]) => {
  // Just emit the selected tags - parent component will handle creation via connectOrCreate
  emit('setSelectedTags', newTags);
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
};
</script>

<template>
  <MultiSelect
    :model-value="selectedTags"
    :options="tagOptions"
    :description="description"
    :loading="tagsLoading"
    placeholder="Select tags..."
    search-placeholder="Type to search or create tags..."
    test-id="tag-picker"
    searchable
    :show-chips="false"
    @update:model-value="handleUpdateTags"
    @search="handleSearch"
  />
</template>
