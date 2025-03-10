<script lang="ts" setup>
import { ref, nextTick, computed } from "vue";
import type { Discussion } from "@/__generated__/graphql";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import CreateButton from "@/components/CreateButton.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import TextInput from "@/components/TextInput.vue";
import { UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { GET_DISCUSSION, IS_DISCUSSION_ANSWERED } from "@/graphQLData/discussion/queries";
import { DISCUSSION_TITLE_CHAR_LIMIT } from "@/utils/constants";
import { modProfileNameVar, usernameVar } from "@/cache";
import { useTheme } from "@/composables/useTheme";
import { useRoute } from "nuxt/app";
import CheckCircleIcon from "@/components/icons/CheckCircleIcon.vue";

const { theme } = useTheme()

const route = useRoute();
const titleEditMode = ref(false);

const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);
const discussionId = computed(() =>
  typeof route.params.discussionId === "string" ? route.params.discussionId : ""
);

const {
  result: isDiscussionAnsweredResult,
  error: isDiscussionAnsweredError,
  loading: isDiscussionAnsweredLoading,
} = useQuery(IS_DISCUSSION_ANSWERED, {
  discussionId: discussionId.value,
  channelUniqueName: channelId.value,
})

const answered = computed(() => {
  if (isDiscussionAnsweredLoading.value) return false;
  if (isDiscussionAnsweredError.value) return false;
  return isDiscussionAnsweredResult.value?.discussionChannels[0]?.answered || false;
})

const {
  result: getDiscussionResult,
  error: getDiscussionError,
  loading: getDiscussionLoading,
  onResult: onGetDiscussionResult,
} = useQuery(GET_DISCUSSION, {
  id: discussionId,
  loggedInModName: modProfileNameVar.value || "",
  channelUniqueName: channelId.value,
});

const discussion = computed<Discussion | null>(() =>{
  const discussion = getDiscussionResult.value?.discussions[0];
  if (getDiscussionLoading.value && !discussion) {
    return null
  } 
  if (getDiscussionError.value){
    return null
  }
  return discussion || null
});
const authorIsLoggedInUser = computed(
  () => discussion.value?.Author?.username === usernameVar.value
);

const titleInputRef = ref<HTMLElement | null>(null);
const formValues = ref({
  title: getDiscussionResult.value?.discussion?.title || "",
});
onGetDiscussionResult(
  (result) =>
    (formValues.value.title = result?.data?.discussions[0]?.title || "")
);

const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
  variables: {
    where: { id: discussionId.value },
    updateDiscussionInput: formValues.value,
  },
}));

onDone(() => (titleEditMode.value = false));

const onClickEdit = () => {
  titleEditMode.value = true;
  nextTick(() => {
    if (!titleEditMode.value) return;
    titleInputRef.value?.focus();
  });
};

const formattedDate = computed(() => {
  if (!discussion.value?.createdAt) return "";
  // Date should be in this format: Mar 30, 2023
  return new Date(discussion.value.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
});
</script>

<template>
  <div class="w-full">
    <div
      class="mb-3 mt-4 w-full flex flex-col md:flex-row md:items-center md:justify-between md:space-x-2"
    >
      <v-skeleton-loader
        v-if="getDiscussionLoading"
        class="flex-1"
        type="text"
        :theme="theme"
      />
      <div v-else ref="discussionDetail" class="flex-1">
        <h2
          v-if="!titleEditMode"
          class="text-wrap px-1 text-md md:text-2xl font-medium sm:tracking-tight"
        >
          {{ discussion && discussion.title ? discussion.title : "Couldn't find the discussion" }}
        </h2>

        <TextInput
          v-if="titleEditMode"
          ref="titleInputRef"
          :test-id="'title-input'"
          :value="formValues.title"
          :full-width="true"
          @update="formValues.title = $event"
        />
        <CharCounter
          v-if="titleEditMode"
          :current="formValues.title?.length || 0"
          :max="DISCUSSION_TITLE_CHAR_LIMIT"
        />
        <p
          v-if="!titleEditMode"
          class="ml-1 mt-1 text-gray-500 dark:text-gray-400 text-sm flex items-center"
        >
          <span
            v-if="answered"
            class="text-green-500 dark:text-green-400 mr-1 border dark:border-green-400 border-green-500 rounded-full text-xs flex gap-1 items-center py-1 px-2"
            aria-label="This discussion has been answered"
          > 
            <CheckCircleIcon class="h-4 w-4" /> Answered
          </span>
          <span>{{
            `${discussion?.Author ? discussion.Author.username : "[Deleted]"} started this discussion ${formattedDate ? `on ${formattedDate}` : ''} in ${channelId}`
          }}</span>
        </p>
      </div>
      <RequireAuth class="hidden md:block" :full-width="false">
        <template #has-auth>
          <GenericButton
            v-if="!titleEditMode && authorIsLoggedInUser"
            :text="'Edit'"
            @click="onClickEdit"
          />
          <CreateButton
            v-if="!titleEditMode"
            class="ml-2"
            :to="`/forums/${channelId}/discussions/create`"
            :label="'New Discussion'"
          />
          <PrimaryButton
            v-if="titleEditMode"
            :disabled="formValues.title.length === 0 || formValues.title.length > DISCUSSION_TITLE_CHAR_LIMIT"
            :label="'Save'"
            :loading="updateDiscussionLoading"
            @click="updateDiscussion"
          />
          <GenericButton
            v-if="titleEditMode"
            :text="'Cancel'"
            class="ml-2"
            @click="titleEditMode = false"
          />
        </template>
        <template #does-not-have-auth>
          <PrimaryButton class="ml-2" :label="'New Discussion'" />
        </template>
      </RequireAuth>
    </div>

    <ErrorBanner
      v-if="getDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="getDiscussionError.message"
    />
    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />
  </div>
</template>
