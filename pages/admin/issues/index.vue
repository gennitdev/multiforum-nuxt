<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import type { Issue } from "@/__generated__/graphql";
import { GET_ISSUES } from "@/graphQLData/issue/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "nuxt/app";
import ModIssueListItem from "@/components/mod/ModIssueListItem.vue";

const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  if (typeof route.params.forumId !== "string") {
    return "";
  }
  return route.params.forumId;
});

const getDefaultFilter = () => {
  // If there is no query param at all, the default should be true.
  // If the query param is given as false, that overrides that.

  if (route.query.showOnlyServerRuleViolations === "false") {
    return false
  }
  return true
}
const showOnlyServerRuleViolations = ref(getDefaultFilter());

const variables = computed(() => {
  if (showOnlyServerRuleViolations.value){
    return {
      issueWhere: {
        isOpen: true,
        flaggedServerRuleViolation: true
      }
    }
  }
  return {
    issueWhere: {
      isOpen: true
    }
  }
})

const {
  result: getIssuesResult,
  error: getIssuesError,
  loading: getIssuesLoading,
  refetch,
} = useQuery(GET_ISSUES, variables, {
  fetchPolicy: "cache-first",
});

const issues = computed<Issue[]>(() => {
  if (getIssuesLoading.value || getIssuesError.value) {
    return [];
  }
  return getIssuesResult.value?.issues || [];
});

const toggleShowOnlyServerRuleViolations = () => {
  showOnlyServerRuleViolations.value = !showOnlyServerRuleViolations.value;
  const newQuery = {
    ...route.query,
    showOnlyServerRuleViolations: showOnlyServerRuleViolations.value.toString(),
  };
  router.push({ query: newQuery });
};

// Watch for route change to update showOnlyServerRuleViolations and refetch
watch(
  () => route.query,
  () => {
    if (route.query) {
      showOnlyServerRuleViolations.value =
        route.query.showOnlyServerRuleViolations === "true";
      refetch();
    }
  }
);

// Watch for checkbox changes to refetch
watch(showOnlyServerRuleViolations, () => {
  refetch();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-end">
      <input
        type="checkbox"
        :checked="showOnlyServerRuleViolations"
        @change="toggleShowOnlyServerRuleViolations"
        class="mr-2"
        data-testid="show-only-server-rule-violations"
      />
      <label for="show-only-server-rule-violations" class="mr-2"
        >Show only server rule violations</label
      >
    </div>
    <ul
      class="divide-y border-t border-gray-200 dark:border-gray-800 dark:text-white"
      data-testid="issue-list"
    >
      <ModIssueListItem
        v-for="issue in issues"
        :key="issue.id"
        :issue="issue"
        :channel-id="channelId"
      />
    </ul>
  </div>
</template>
