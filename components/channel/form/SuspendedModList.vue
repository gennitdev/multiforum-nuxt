<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { GET_SUSPENDED_MODS_WITH_SEARCH } from "@/graphQLData/mod/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "nuxt/app";
import { DateTime } from "luxon";
import SearchBar from "@/components/SearchBar.vue";
import LoadMore from "@/components/LoadMore.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { getSuspendedModFilterValuesFromParams } from "@/utils/getSuspendedModFilterValuesFromParams";
import { updateFilters } from "@/utils/routerUtils";

const SUSPENDED_MODS_PAGE_LIMIT = 15;

const route = useRoute();
const router = useRouter();

const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

// Filter values from URL params
const filterValues = ref(getSuspendedModFilterValuesFromParams({ route }));

const searchInputComputed = computed(() => {
  return filterValues.value.searchInput || "";
});

const { result, loading, error, fetchMore } = useQuery(
  GET_SUSPENDED_MODS_WITH_SEARCH,
  () => ({
    channelUniqueName: forumId.value,
    limit: SUSPENDED_MODS_PAGE_LIMIT,
    offset: 0,
  }),
  {
    fetchPolicy: "cache-first",
  }
);

const suspensions = computed(() => {
  const mods = result.value?.channels[0]?.SuspendedMods ?? [];
  const searchTerm = searchInputComputed.value.toLowerCase();
  
  if (!searchTerm) {
    return mods;
  }
  
  return mods.filter((mod) => {
    const displayName = (mod.SuspendedMod?.displayName || "").toLowerCase();
    return displayName.includes(searchTerm);
  });
});

const filteredAggregateCount = computed(() => {
  const searchTerm = searchInputComputed.value.toLowerCase();
  if (!searchTerm) {
    return result.value?.channels[0]?.SuspendedModsAggregate?.count ?? 0;
  }
  return suspensions.value.length;
});

const humanReadableDate = (dateISO: string): string => {
  return DateTime.fromISO(dateISO).toLocaleString(DateTime.DATETIME_MED);
};

// Watch for route query changes to update filter values
watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getSuspendedModFilterValuesFromParams({ route });
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
      offset: suspensions.value.length,
      limit: SUSPENDED_MODS_PAGE_LIMIT,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;

      return {
        channels: [{
          ...previousResult.channels[0],
          SuspendedMods: [
            ...previousResult.channels[0].SuspendedMods,
            ...fetchMoreResult.channels[0].SuspendedMods,
          ],
        }],
      };
    },
  });
};

defineEmits(["click-remove-mod"]);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <!-- Search Bar -->
    <div class="mb-4">
      <SearchBar
        data-testid="suspended-mods-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search by display name'"
        :auto-focus="false"
        :small="true"
        @update-search-input="updateSearchInput"
      />
    </div>

    <div v-if="loading">Loading...</div>
    <ErrorBanner v-else-if="error" :text="error.message" />
    <div
      v-else-if="
        result?.channels?.length === 0 ||
        result?.channels[0]?.SuspendedMods?.length === 0
      "
      class="text-sm"
    >
      <div v-if="searchInputComputed">
        No suspended mods found matching "{{ searchInputComputed }}".
      </div>
      <div v-else>
        There are no active mod suspensions.
      </div>
    </div>

    <div v-if="suspensions && suspensions.length > 0" class="flex-col text-sm">
      <div class="text-sm font-bold">
        {{ `Active Suspensions (${filteredAggregateCount})` }}
        <span v-if="searchInputComputed" class="text-gray-500 dark:text-gray-400">
          - showing results for "{{ searchInputComputed }}"
        </span>
      </div>
      <div
        v-for="suspension in suspensions"
        :key="suspension.id"
        class="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
      >
        <div class="flex-col w-full">
          <div class="flex justify-between gap-2 w-full">
            <nuxt-link
              :to="{
                name: 'mod-modId',
                params: { modId: suspension?.SuspendedMod?.displayName },
              }"
              class="flex items-center dark:text-white"
            >
              <AvatarComponent
                :text="suspension?.SuspendedMod?.displayName"
                class="mr-2 h-6 w-6"
              />
              <span class="text-sm">{{
                `${suspension?.SuspendedMod?.displayName} ${suspension?.username ? `(${suspension?.username})` : ""}`
              }}</span>
            </nuxt-link>
            <nuxt-link
              v-if="suspension.RelatedIssue"
              class="rounded border border-orange-500 px-2 py-1 text-orange-500 items-center gap-1"
              :to="{
                name: 'forums-forumId-issues-issueId',
                params: { issueId: suspension.RelatedIssue?.id },
              }"
            >
              Related Issue
            </nuxt-link>
          </div>

          <div
            v-if="!suspension.suspendedIndefinitely"
            class="text-sm text-gray-500 dark:text-gray-300"
          >
            {{
              `Suspended until ${humanReadableDate(suspension?.suspendedUntil)}`
            }}
          </div>
          <div v-else class="text-sm text-gray-500 dark:text-gray-300">
            {{
              `Suspended indefinitely as of ${humanReadableDate(suspension?.createdAt)}`
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="suspensions.length > 0">
      <LoadMore
        class="ml-4 justify-self-center"
        :loading="loading"
        :reached-end-of-results="filteredAggregateCount === suspensions.length"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
