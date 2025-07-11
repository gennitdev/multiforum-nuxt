<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { GET_SUSPENDED_USERS_WITH_SEARCH } from "@/graphQLData/mod/queries";
import { DateTime } from "luxon";
import SearchBar from "@/components/SearchBar.vue";
import LoadMore from "@/components/LoadMore.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { getSuspendedUserFilterValuesFromParams } from "@/utils/getSuspendedUserFilterValuesFromParams";
import { updateFilters } from "@/utils/routerUtils";

const SUSPENDED_USERS_PAGE_LIMIT = 15;

const route = useRoute();
const router = useRouter();

const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

// Filter values from URL params
const filterValues = ref(getSuspendedUserFilterValuesFromParams({ route }));

const searchInputComputed = computed(() => {
  return filterValues.value.searchInput || "";
});

const {
  result: suspendedUsersResult,
  loading,
  error,
  fetchMore,
  refetch,
} = useQuery(GET_SUSPENDED_USERS_WITH_SEARCH, {
  channelUniqueName: forumId.value,
  searchInput: searchInputComputed.value,
  limit: SUSPENDED_USERS_PAGE_LIMIT,
  offset: 0,
});

const suspendedUsers = computed(() => {
  const users = suspendedUsersResult.value?.channels[0]?.SuspendedUsers ?? [];
  const searchTerm = searchInputComputed.value.toLowerCase();
  
  if (!searchTerm) {
    return users;
  }
  
  return users.filter((user) => {
    const username = (user.SuspendedUser?.username || user.username || "").toLowerCase();
    return username.includes(searchTerm);
  });
});

const filteredAggregateCount = computed(() => {
  const searchTerm = searchInputComputed.value.toLowerCase();
  if (!searchTerm) {
    return suspendedUsersResult.value?.channels[0]?.SuspendedUsersAggregate?.count ?? 0;
  }
  return suspendedUsers.value.length;
});

const humanReadableDate = (dateISO: string): string => {
  return DateTime.fromISO(dateISO).toLocaleString(DateTime.DATETIME_MED);
};

// Watch for route query changes to update filter values
watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getSuspendedUserFilterValuesFromParams({ route });
    }
  }
);

// Update search input via URL params
const updateSearchInput = (searchInput: string) => {
  updateFilters({
    router,
    route,
    params: { searchInput },
  });
};

// Load more functionality
const loadMore = () => {
  fetchMore({
    variables: {
      offset: suspendedUsers.value.length,
      limit: SUSPENDED_USERS_PAGE_LIMIT,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;

      return {
        channels: [{
          ...previousResult.channels[0],
          SuspendedUsers: [
            ...previousResult.channels[0].SuspendedUsers,
            ...fetchMoreResult.channels[0].SuspendedUsers,
          ],
        }],
      };
    },
  });
};
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="text-xl font-bold mb-2">User Suspensions</h1>
      <p class="text-gray-600 text-sm dark:text-gray-400">
        {{
          `These are the active suspensions of users from ${forumId}. It's possible for a user to be listed twice if moderation actions were taken on more than one of their posts.`
        }}
      </p>
      <ul
        class="text-gray-600 text-sm dark:text-gray-400 list-disc ml-4 list-outside"
      >
        <li>
          To un-suspend a user, click Related Issue and follow the provided
          instructions.
        </li>
        <li>
          To suspend a user, go to the rule-breaking comment or post and click
          Suspend User in the action menu.
        </li>
      </ul>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <SearchBar
        data-testid="suspended-users-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search by username'"
        :auto-focus="false"
        :small="true"
        @update-search-input="updateSearchInput"
      />
    </div>

    <div class="flex flex-col gap-3 py-3 dark:text-white">
      <div v-if="loading">Loading...</div>
      <ErrorBanner v-else-if="error" :text="error.message" />
      <div v-else-if="suspendedUsers.length === 0">
        <div v-if="searchInputComputed">
          No suspended users found matching "{{ searchInputComputed }}".
        </div>
        <div v-else>
          This forum has no suspended users.
        </div>
      </div>
      <div>
        {{ `Active Suspensions (${filteredAggregateCount})` }}
        <span v-if="searchInputComputed" class="text-sm text-gray-500 dark:text-gray-400">
          - showing results for "{{ searchInputComputed }}"
        </span>
      </div>
      <div v-if="suspendedUsers.length > 0" class="flex-col text-sm">
        <div
          v-for="user in suspendedUsers"
          :key="user.id"
          class="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
        >
          <div class="flex-col w-full">
            <div class="flex justify-between gap-2 w-full">
              <nuxt-link
                :to="{
                  name: 'u-username',
                  params: { username: user.SuspendedUser?.username || user.username },
                }"
                class="flex items-center dark:text-white font-bold"
              >
                <AvatarComponent
                  :text="user.SuspendedUser?.username || user.username"
                  :src="user.SuspendedUser?.profilePicURL ?? ''"
                  class="mr-2 h-6 w-6"
                />
                <UsernameWithTooltip
                  v-if="user.SuspendedUser?.username || user.username"
                  :username="user.SuspendedUser?.username || user.username"
                  :src="user.SuspendedUser?.profilePicURL ?? ''"
                  :display-name="user.SuspendedUser?.displayName ?? ''"
                  :comment-karma="user.SuspendedUser?.commentKarma ?? 0"
                  :discussion-karma="user.SuspendedUser?.discussionKarma ?? 0"
                  :account-created="user.createdAt ?? ''"
                />
              </nuxt-link>
              <nuxt-link
                v-if="user.RelatedIssue"
                class="flex rounded border border-orange-500 px-2 py-1 text-orange-500 items-center gap-1"
                :to="{
                  name: 'forums-forumId-issues-issueId',
                  params: { issueId: user.RelatedIssue?.id },
                }"
              >
                Related Issue
              </nuxt-link>
            </div>
            <div
              class="text-sm text-gray-500 dark:text-gray-300"
              v-if="!user.suspendedIndefinitely"
            >
              {{ `Suspended until ${humanReadableDate(user.suspendedUntil)}` }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-300" v-else>
              {{
                `Suspended indefinitely as of ${humanReadableDate(user.createdAt)}`
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="suspendedUsers.length > 0">
        <LoadMore
          class="ml-4 justify-self-center"
          :loading="loading"
          :reached-end-of-results="filteredAggregateCount === suspendedUsers.length"
          @load-more="loadMore"
        />
      </div>
    </div>
  </div>
</template>
