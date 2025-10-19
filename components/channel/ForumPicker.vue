<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL_NAMES } from '@/graphQLData/channel/queries';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption } from '@/components/MultiSelect.vue';
import type { Channel } from '@/__generated__/graphql';

// Props definition - used in template
const props = defineProps({
  selectedChannels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
});

// Emits definition
const emit = defineEmits(['setSelectedChannels']);

const searchQuery = ref('');
const debouncedSearchQuery = ref('');

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Watch searchQuery and update debouncedSearchQuery after delay
watch(searchQuery, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = newValue;
  }, 300); // 300ms debounce
});

const { loading: channelsLoading, result: channelsResult } = useQuery(
  GET_CHANNEL_NAMES,
  computed(() => ({
    channelWhere: {
      uniqueName_MATCHES: debouncedSearchQuery.value
        ? `(?i).*${debouncedSearchQuery.value}.*`
        : '.*',
    },
  })),
  {
    fetchPolicy: 'cache-and-network',
  }
);

const channelOptions = computed<MultiSelectOption[]>(() => {
  const channels = channelsResult.value?.channels || [];
  const mappedChannels = channels.map((channel: Channel) => ({
    value: channel.uniqueName,
    label: channel.displayName
      ? `${channel.uniqueName} (${channel.displayName})`
      : channel.uniqueName,
    avatar: channel.channelIconURL || '',
  }));

  // Always include selected channels in options, even if they don't match current search
  // This ensures selected chips can always be displayed
  const existingChannelValues = new Set(
    mappedChannels.map((ch: any) => ch.value)
  );

  // Add any selected channels that aren't in the current search results
  (props.selectedChannels || []).forEach((selectedValue) => {
    if (!existingChannelValues.has(selectedValue)) {
      // Create a basic option for the selected channel that's not in current results
      mappedChannels.push({
        value: selectedValue,
        label: selectedValue, // Use uniqueName as label since we don't have the full data
        avatar: '',
      });
    }
  });

  return mappedChannels;
});

const handleUpdateChannels = (newChannels: string[]) => {
  emit('setSelectedChannels', newChannels);
};

const handleSearch = (query: string) => {
  // Store search query for GraphQL filtering
  searchQuery.value = query;
  // Do NOT emit any events that could affect selection
};
</script>

<template>
  <MultiSelect
    :model-value="props.selectedChannels"
    :options="channelOptions"
    :description="props.description"
    :loading="channelsLoading"
    :test-id="props.testId"
    placeholder="Select forums..."
    search-placeholder="Type to search..."
    searchable
    :show-chips="true"
    height="h-12"
    @update:model-value="handleUpdateChannels"
    @search="handleSearch"
  />
</template>
