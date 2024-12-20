<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Channel } from '@/__generated__/graphql';
import ChannelListItem from '@/components/channel/ChannelListItem.vue';
import LoadMore from '@/components/LoadMore.vue';

// Define props
defineProps({
  channels: {
    type: Array as PropType<Array<Channel>>,
    default: () => [],
  },
  resultCount: {
    type: Number,
    default: 0,
  },
  searchInput: {
    type: String,
    default: '',
  },
  selectedTags: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
});

const emit = defineEmits(['filterByTag', 'loadMore']);

function filterByTag(tag: string) {
  emit('filterByTag', tag);
}
</script>

<template>
  <div>
    <p v-if="channels.length === 0" class="mt-2 text-sm font-normal dark:text-white">
      There are no results.
    </p>
    <table class="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-800">
      <thead class="border border-gray-300 dark:border-gray-800">
        <tr class="border-b border border-gray-300 dark:border-gray-800">
          <th class="px-4 py-2 border-r border border-gray-300 dark:border-gray-800">Channel</th>
          <th class="px-4 py-2 border-r border border-gray-300 dark:border-gray-800">Discussions</th>
          <th class="px-4 py-2 border-r border border-gray-300 dark:border-gray-800">Events</th>
        </tr>
      </thead>
      <tbody>
        <ChannelListItem
          v-for="channel in channels"
          :key="channel.uniqueName"
          :channel="channel"
          :search-input="searchInput"
          :selected-tags="selectedTags"
          class="border-b border border-gray-300 dark:border-gray-800"
          @filter-by-tag="filterByTag"
        />
      </tbody>
    </table>
    <div class="m-10 grid justify-items-stretch">
      <LoadMore
        class="justify-self-center font-normal"
        :reached-end-of-results="resultCount === channels.length"
        @load-more="$emit('loadMore')"
      />
    </div>
  </div>
</template>

<style scoped></style>
