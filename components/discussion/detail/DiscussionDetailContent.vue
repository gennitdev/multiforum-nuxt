<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import {
  GET_DISCUSSION_COMMENTS,
  GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
  GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
} from "@/graphQLData/comment/queries";
import type {
  Discussion,
  DiscussionChannel,
  Comment,
} from "@/__generated__/graphql";
import { ADD_FEEDBACK_COMMENT_TO_DISCUSSION } from "@/graphQLData/discussion/mutations";
import ErrorBanner from "@/components/ErrorBanner.vue";
import DiscussionBody from "@/components/discussion/detail/DiscussionBody.vue";
import DiscussionHeader from "@/components/discussion/detail/DiscussionHeader.vue";
import DiscussionCommentsWrapper from "@/components/discussion/detail/DiscussionCommentsWrapper.vue";
import DiscussionChannelLinks from "@/components/discussion/detail/DiscussionChannelLinks.vue";
import DiscussionRootCommentFormWrapper from "@/components/discussion/form/DiscussionRootCommentFormWrapper.vue";
import DiscussionVotes from "@/components/discussion/vote/DiscussionVotes.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import GenericFeedbackFormModal from "@/components/GenericFeedbackFormModal.vue";
import ConfirmUndoDiscussionFeedbackModal from "@/components/discussion/detail/ConfirmUndoDiscussionFeedbackModal.vue";
import EditFeedbackModal from "@/components/discussion/detail/EditFeedbackModal.vue";
import Notification from "@/components/NotificationComponent.vue";
import DiscussionAlbum from "@/components/discussion/detail/DiscussionAlbum.vue";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { usernameVar, modProfileNameVar } from "@/cache";
import { useRoute } from "nuxt/app";
import DiscussionBodyEditForm from "./DiscussionBodyEditForm.vue";
import MarkAsAnsweredButton from "./MarkAsAnsweredButton.vue";
import ArchivedDiscussionInfoBanner from "./ArchivedDiscussionInfoBanner.vue";

const COMMENT_LIMIT = 50;

const props = defineProps({
  discussionId: {
    type: String,
    required: true,
  },
  compactMode: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const offset = ref(0);
const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);
const loggedInUserModName = computed(() => modProfileNameVar.value);
const lastValidDiscussion = ref<Discussion | null>(null);

const {
  result: getDiscussionResult,
  error: getDiscussionError,
  refetch: refetchDiscussion,
  onResult: onGetDiscussionResult,
} = useQuery(
  GET_DISCUSSION,
  {
    id: props.discussionId,
    loggedInModName: loggedInUserModName,
    channelUniqueName: channelId.value,
  },
  {
    fetchPolicy: "cache-first",
  }
);

onGetDiscussionResult((newResult) => {
  if (newResult?.data?.discussions?.length) {
    lastValidDiscussion.value = newResult.data.discussions[0];
  }
});

const {
  mutate: addFeedbackCommentToDiscussion,
  error: addFeedbackCommentToDiscussionError,
  loading: addFeedbackCommentToDiscussionLoading,
  onDone: onAddFeedbackCommentToDiscussionDone,
} = useMutation(ADD_FEEDBACK_COMMENT_TO_DISCUSSION);

const showFeedbackFormModal = ref(false);
const showEditFeedbackModal = ref(false);
const showConfirmUndoFeedbackModal = ref(false);
const showFeedbackSubmittedSuccessfully = ref(false);

onAddFeedbackCommentToDiscussionDone(() => {
  showFeedbackFormModal.value = false;
  showFeedbackSubmittedSuccessfully.value = true;
});

const commentSort = computed(() => getSortFromQuery(route.query));

const {
  result: getDiscussionChannelResult,
  error: getDiscussionChannelError,
  loading: getDiscussionChannelLoading,
  fetchMore: fetchMoreComments,
  refetch: refetchDiscussionChannel,
} = useQuery(
  GET_DISCUSSION_COMMENTS,
  {
    discussionId: props.discussionId,
    channelUniqueName: channelId.value,
    modName: loggedInUserModName.value,
    offset: offset.value,
    limit: COMMENT_LIMIT,
    sort: commentSort.value,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const discussionBodyEditMode = ref(false);

const discussion = computed<Discussion | null>(() => {
  const currentDiscussion = getDiscussionResult.value?.discussions[0];

  return currentDiscussion || lastValidDiscussion.value;
});

watch(commentSort, () =>
  // @ts-ignore - the sort is correctly typed.
  fetchMoreComments({ variables: { sort: commentSort.value } })
);

const activeDiscussionChannel = computed<DiscussionChannel | null>(() => {
  return (
    getDiscussionChannelResult.value?.getCommentSection?.DiscussionChannel ||
    null
  );
});

const isArchived = computed(() => {
  return activeDiscussionChannel.value?.archived
});

const locked = computed(() => {
  if (isArchived.value) {
    // Archived means the mods hid this discussion from channel view.
    // If that is the case, don't allow further comments.
    return true;
  }
  // A locked discussion allows no further comments, but the mods
  // may not archive it if they think the existing discussion has merit.
  return activeDiscussionChannel.value?.locked || false;
});

const comments = computed(() =>
  getDiscussionChannelError.value
    ? []
    : getDiscussionChannelResult.value?.getCommentSection?.Comments || []
);

const loadedRootCommentCount = computed(() => {
  const rootComments = comments.value.filter(
    (comment: Comment) => comment.ParentComment === null
  );
  return rootComments.length;
});

const { result: getDiscussionChannelCommentAggregateResult } = useQuery(
  GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
  {
    discussionId: props.discussionId,
    channelUniqueName: channelId,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const { result: getDiscussionChannelRootCommentAggregateResult } = useQuery(
  GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
  {
    discussionId: props.discussionId,
    channelUniqueName: channelId,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const commentCount = computed(
  () => activeDiscussionChannel.value?.CommentsAggregate?.count || 0
);

const aggregateCommentCount = computed(() => {
  return (
    getDiscussionChannelCommentAggregateResult.value?.discussionChannels[0]
      ?.CommentsAggregate?.count || 0
  );
});

const aggregateRootCommentCount = computed(() => {
  return (
    getDiscussionChannelRootCommentAggregateResult.value?.discussionChannels[0]
      ?.CommentsAggregate?.count || 0
  );
});

const loadMore = () => {
  fetchMoreComments({
    variables: {
      offset:
        getDiscussionChannelResult.value?.getCommentSection?.Comments.length ||
        0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      offset.value += fetchMoreResult.getCommentSection.Comments.length;
      return {
        ...previousResult,
        getCommentSection: {
          ...previousResult.getCommentSection,
          Comments: [
            ...previousResult.getCommentSection.Comments,
            ...fetchMoreResult.getCommentSection.Comments,
          ],
        },
      };
    },
  });
};

const reachedEndOfResults = computed(
  () =>
    loadedRootCommentCount.value >= aggregateRootCommentCount.value ||
    loadedRootCommentCount.value >= commentCount.value
);

const loggedInUserIsAuthor = computed(() => {
  return discussion.value?.Author?.username === usernameVar.value;
});
const discussionAuthor = computed(
  () => discussion.value?.Author?.username || ""
);

const handleClickGiveFeedback = () => {
  showFeedbackFormModal.value = true;
};

const feedbackText = ref("");
const previousOffset = ref(0);

const handleSubmitFeedback = async () => {
  if (!feedbackText.value) {
    console.error("No feedback text found.");
    return;
  }
  if (!loggedInUserModName.value) {
    console.error("No mod name found.");
    return;
  }
  if (!activeDiscussionChannel.value?.channelUniqueName) {
    console.error("No active discussion channel found.");
    return;
  }
  await addFeedbackCommentToDiscussion({
    discussionId: props.discussionId,
    text: feedbackText.value,
    modProfileName: loggedInUserModName.value,
    channelId: activeDiscussionChannel.value?.channelUniqueName,
    discussionChannelId: activeDiscussionChannel.value?.id,
  });
  // Refetch the discussion so that the thumbs-down shows
  // that it's active, meaning the user has given feedback.
  refetchDiscussion();
};
const handleFeedbackInput = (event: string) => {
  feedbackText.value = event;
};
const handleClickUndoFeedback = () => {
  showConfirmUndoFeedbackModal.value = true;
};
const handleClickEditFeedback = () => {
  showEditFeedbackModal.value = true;
};
const handleClickEditDiscussionBody = () => {
  discussionBodyEditMode.value = true;
};
</script>

<template>
  <div class="w-full">
    <PageNotFound v-if="!discussion && !activeDiscussionChannel" />
    <div
      v-else
      class="flex max-w-screen-2xl justify-center space-y-2 bg-white py-2 dark:bg-gray-800"
    >
      <div class="w-full flex-col space-y-2">
        <ErrorBanner
          v-if="getDiscussionError"
          class="mt-2 px-4"
          :text="getDiscussionError.message"
        />
        <ArchivedDiscussionInfoBanner 
          v-if="isArchived"
          :channel-id="channelId"
          :discussion-channel-id="activeDiscussionChannel?.id"
        />
        <InfoBanner v-else-if="locked" text="This discussion is locked. New comments cannot be added." />
        <v-row v-if="discussion" class="flex justify-center">
          <v-col>
            <div class="space-y-3 px-2">
              <div class="rounded-lg pb-2 dark:border-gray-700">
                <DiscussionHeader
                  :discussion="discussion"
                  :discussion-channel-id="activeDiscussionChannel?.id"
                  :channel-id="channelId"
                  :compact-mode="compactMode"
                  :discussion-body-edit-mode="discussionBodyEditMode"
                  :discussion-is-archived="isArchived || false"
                  @handle-click-give-feedback="handleClickGiveFeedback"
                  @handle-click-edit-body="handleClickEditDiscussionBody"
                  @cancel-edit-discussion-body="discussionBodyEditMode = false"
                />
                <div class="flex-1">
                  <DiscussionBodyEditForm 
                    v-if="discussionBodyEditMode"
                    :discussion="discussion"
                    @close-editor="discussionBodyEditMode = false"
                  />
                  <DiscussionBody
                    v-else
                    :discussion="discussion"
                    :channel-id="channelId"
                    :discussion-channel-id="activeDiscussionChannel?.id"
                    :emoji-json="activeDiscussionChannel?.emoji"
                  >
                    <template #album-slot>
                      <div class="bg-black text-white">
                        <DiscussionAlbum
                          v-if="
                            discussion.Album &&
                            discussion.Album.Images?.length > 0
                          "
                          :album="discussion.Album"
                          :carousel-format="true"
                        />
                      </div>
                    </template>
                    <template #mark-answered-slot>
                      <MarkAsAnsweredButton 
                        v-if="loggedInUserIsAuthor"
                        :answered="activeDiscussionChannel?.answered || false" 
                        :discussion-id="discussionId"
                        :channel-id="channelId"
                        :discussion-channel-id="activeDiscussionChannel?.id"
                        @mark-unanswered="refetchDiscussionChannel"
                      />
                    </template>
                    <template #button-slot>
                      <div class="flex-col items-center">
                        <DiscussionVotes
                          v-if="activeDiscussionChannel"
                          :discussion="discussion"
                          :discussion-channel="activeDiscussionChannel"
                          :show-downvote="!loggedInUserIsAuthor"
                          @handle-click-give-feedback="handleClickGiveFeedback"
                          @handle-click-undo-feedback="handleClickUndoFeedback"
                          @handle-click-edit-feedback="handleClickEditFeedback"
                        />
                      </div>
                    </template>
                  </DiscussionBody>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
        <div>
          <DiscussionRootCommentFormWrapper
            v-if="activeDiscussionChannel && !isArchived && !locked"
            :key="`${channelId}${discussionId}`"
            class="pr-3"
            :channel-id="channelId"
            :discussion-channel="activeDiscussionChannel || undefined"
            :previous-offset="previousOffset"
            :mod-name="loggedInUserModName"
          />
          
          <div class="mx-2 my-6 rounded-lg">
            <DiscussionCommentsWrapper
              :key="activeDiscussionChannel?.id"
              :loading="getDiscussionChannelLoading"
              :aggregate-comment-count="aggregateCommentCount || 0"
              :discussion-channel="activeDiscussionChannel || undefined"
              :discussion-author="discussionAuthor || ''"
              :comments="comments"
              :mod-name="loggedInUserModName"
              :reached-end-of-results="reachedEndOfResults"
              :previous-offset="previousOffset"
              :locked="locked"
              @load-more="loadMore"
            />
          </div>
          <DiscussionChannelLinks
            v-if="discussion && discussion.DiscussionChannels"
            :discussion-channels="discussion.DiscussionChannels"
            :channel-id="activeDiscussionChannel?.channelUniqueName || ''"
          />
        </div>
      </div>
    </div>
    <GenericFeedbackFormModal
      v-if="showFeedbackFormModal"
      :error="addFeedbackCommentToDiscussionError?.message"
      :open="showFeedbackFormModal"
      :loading="addFeedbackCommentToDiscussionLoading"
      :primary-button-disabled="!feedbackText"
      @close="showFeedbackFormModal = false"
      @update-feedback="handleFeedbackInput"
      @primary-button-click="handleSubmitFeedback"
    />
    <ConfirmUndoDiscussionFeedbackModal
      v-if="showConfirmUndoFeedbackModal"
      :key="loggedInUserModName"
      :open="showConfirmUndoFeedbackModal"
      :discussion-id="discussionId"
      :mod-name="loggedInUserModName"
      @close="showConfirmUndoFeedbackModal = false"
    />
    <EditFeedbackModal
      v-if="showEditFeedbackModal"
      :open="showEditFeedbackModal"
      :discussion-id="discussionId"
      :mod-name="loggedInUserModName"
      @close="showEditFeedbackModal = false"
    />
    <Notification
      :show="showFeedbackSubmittedSuccessfully"
      :title="'Your feedback was submitted successfully.'"
      @close-notification="showFeedbackSubmittedSuccessfully = false"
    />
  </div>
</template>
