<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRoute } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import ChannelDiscussionListItem from "./ChannelDiscussionListItem.vue";
import LoadMore from "../../LoadMore.vue";
import ErrorBanner from "../../ErrorBanner.vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from "@/graphQLData/discussion/queries";
import { usernameVar } from "@/cache";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getEventFilterValuesFromParams";
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from "@/components/comments/getSortFromQuery";

const DISCUSSION_PAGE_LIMIT = 25;

const emit = defineEmits(["filterByTag", "filterByChannel"]);

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const filterValues = ref(
  getFilterValuesFromParams({
    route,
    channelId: channelId.value,
  })
);

const activeSort = computed(() => {
  return getSortFromQuery(route.query);
});

const activeTimeFrame = computed(() => {
  return getTimeFrameFromQuery(route.query);
});

const searchInput = computed(() => {
  return filterValues.value.searchInput;
});

const selectedTags = computed(() => {
  return filterValues.value.tags;
});

const selectedChannels = computed(() => {
  return filterValues.value.channels;
});

const showArchived = computed(() => {
  return filterValues.value.showArchived;
});

const {
  result: discussionChannelResult,
  error: discussionError,
  loading: discussionLoading,
  refetch: refetchDiscussions,
  fetchMore,
} = useQuery(
  GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
  {
    channelUniqueName: channelId,
    searchInput,
    selectedTags,
    showArchived,
    options: {
      limit: DISCUSSION_PAGE_LIMIT,
      offset: 0,
      sort: activeSort,
      timeFrame: activeTimeFrame,
    },
  },
);
watch(
  () => usernameVar.value,
  (newValue) => {
    if (newValue) {
      // This makes it so that items upvoted by the logged
      // in user show the blue active upvote button.
      refetchDiscussions();
    }
  }
);

const loadMore = () => {
  fetchMore({
    variables: {
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset:
          discussionChannelResult.value?.getDiscussionsInChannel
            .discussionChannels.length,
        // @ts-ignore
        sort: activeSort.value,
        // @ts-ignore
        timeFrame: activeTimeFrame.value,
      },
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        getDiscussionsInChannel: {
          ...previousResult.getDiscussionsInChannel,
          aggregateDiscussionChannelsCount:
            fetchMoreResult.getDiscussionsInChannel
              .aggregateDiscussionChannelsCount,
          discussionChannels: [
            ...previousResult.getDiscussionsInChannel.discussionChannels,
            ...fetchMoreResult.getDiscussionsInChannel.discussionChannels,
          ],
        },
      };
    },
  });
};

const showModProfileModal = ref(false);

onMounted(() => {
  if (
    discussionChannelResult.value?.getDiscussionsInChannel.discussionChannels
      .length === 0
  ) {
    refetchDiscussions();
  }
});

watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      });
    }
  }
);

// Methods
const filterByTag = (tag: string) => {
  emit("filterByTag", tag);
};

const filterByChannel = (channel: string) => {
  emit("filterByChannel", channel);
};

const reachedEndOfResults = computed(() => {
  return (
    discussionChannelResult.value?.getDiscussionsInChannel
      .aggregateDiscussionChannelsCount ===
    discussionChannelResult.value?.getDiscussionsInChannel?.discussionChannels
      .length
  );
});
</script>

<template>
  <div class="px-2 ">
    <slot />
    <p
      v-if="!discussionChannelResult && discussionLoading"
      class="dark:text-gray-200"
    >
      Loading...
    </p>
    <ErrorBanner
      v-else-if="discussionError"
      class="max-w-5xl"
      :text="discussionError.message"
    />
    <p
      v-else-if="
        discussionChannelResult?.getDiscussionsInChannel?.discussionChannels
          ?.length === 0
      "
      class="flex gap-2 p-4"
    >
      <span class="dark:text-white">There are no discussions to show.</span>

      <RequireAuth :full-width="false">
        <template #has-auth>
          <nuxt-link
            v-if="channelId"
            :to="{
              name: 'forums-forumId-discussions-create',
              params: {
                forumId: channelId,
              },
            }"
            class="text-blue-500 underline"
          >
            Create one?
          </nuxt-link>
        </template>
        <template #does-not-have-auth>
          <span class="cursor-pointer text-blue-500 underline"
            >Create one?</span
          >
        </template>
      </RequireAuth>
    </p>

    <ul
      v-else-if="
        discussionChannelResult?.getDiscussionsInChannel?.discussionChannels
          ?.length > 0
      "
      class="dark:divide-gray-700 divide-gray-200 flex flex-col divide-y"
      data-testid="channel-discussion-list"
    >
      <ChannelDiscussionListItem
        v-for="discussionChannel in discussionChannelResult
          .getDiscussionsInChannel.discussionChannels"
        :key="discussionChannel.id"
        :discussion="discussionChannel.Discussion"
        :discussion-channel="discussionChannel"
        :search-input="searchInput"
        :selected-tags="selectedTags"
        :selected-channels="selectedChannels"
        @open-mod-profile="showModProfileModal = true"
        @filter-by-tag="filterByTag"
        @filter-by-channel="filterByChannel"
      />
    </ul>
    <div
      v-if="
        discussionChannelResult?.getDiscussionsInChannel?.discussionChannels
          ?.length > 0
      "
    >
      <LoadMore
        class="justify-self-center mb-6"
        :loading="discussionLoading"
        :reached-end-of-results="reachedEndOfResults"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
