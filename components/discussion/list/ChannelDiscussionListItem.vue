<script lang="ts" setup>
import { ref, computed } from "vue";
import type { PropType } from "vue";
import { useRoute } from "nuxt/app";
import TagComponent from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import DiscussionVotes from "../vote/DiscussionVotes.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import { relativeTime } from "@/utils";
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from "@/__generated__/graphql";
import DiscussionAlbum from "@/components/discussion/detail/DiscussionAlbum.vue";
import CheckCircleIcon from "@/components/icons/CheckCircleIcon.vue";

// Define props
const props = defineProps({
  discussionQueryFilters: {
    type: Object,
    default: () => ({}),
  },
  discussionChannel: {
    type: Object as PropType<DiscussionChannel>,
    required: true,
  },
  discussion: {
    type: Object as PropType<Discussion>,
    default: null,
  },
  searchInput: {
    type: String,
    default: "",
  },
  selectedTags: {
    type: Array,
    default: () => [],
  },
  selectedChannels: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["filterByTag"]);

const route = useRoute();

const channelIdInParams = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);
const defaultUniqueName = computed(
  () => channelIdInParams.value || props.discussionChannel.channelUniqueName
);
const commentCount = computed(
  () => props.discussionChannel?.CommentsAggregate?.count || 0
);

const authorIsAdmin = computed(() => {
  const author = props.discussion?.Author;
  return author?.ServerRoles?.[0]?.showAdminTag || false;
});

const authorIsMod = computed(() => {
  const author = props.discussion?.Author;
  return author?.ChannelRoles?.[0]?.showModTag || false;
});

const errorMessage = ref("");

const authorDisplayName = computed(
  () => props.discussion?.Author?.displayName || ""
);
const authorUsername = computed(
  () => props.discussion?.Author?.username || "Deleted"
);
const authorCommentKarma = computed(
  () => props.discussion?.Author?.commentKarma || 0
);
const authorDiscussionKarma = computed(
  () => props.discussion?.Author?.discussionKarma || 0
);
const authorAccountCreated = computed(
  () => props.discussion?.Author?.createdAt || ""
);
const authorProfilePicURL = computed(
  () => props.discussion?.Author?.profilePicURL || ""
);
const title = computed(() => props.discussion?.title || "[Deleted]");
const relativeTimeAgo = computed(() =>
  relativeTime(props.discussionChannel.createdAt)
);
const tags = computed(
  () => props.discussion?.Tags?.map((tag: Tag) => tag.text) || []
);

const filteredQuery = computed(() => {
  const query = { ...route.query };
  for (const key in query) {
    if (!query[key]) Reflect.deleteProperty(query, key);
  }
  return query;
});
</script>

<template>
  <li class="my-2 pt-2 flex md:rounded-lg border-gray-800 dark:bg-gray-800">
    <div
      class="flex w-full flex-row justify-start gap-4 rounded-lg overflow-hidden"
    >
      <div v-if="discussion" class="w-full flex-col">
        <div class="flex gap-3">
          <div class="w-full flex-col">
            <div>
              <nuxt-link
                :to="{
                  name: 'forums-forumId-discussions-discussionId',
                  params: {
                    forumId: defaultUniqueName,
                    discussionId: discussionChannel.discussionId,
                  },
                  query: filteredQuery,
                }"
                class="w-full flex items-center gap-2 mb-1"
              >
                <span
                  class="cursor-pointer hover:text-gray-500 dark:text-gray-100"
                >
                  <HighlightedSearchTerms
                    :text="title"
                    :search-input="searchInput"
                    :classes="'text-sm text-base hover:underline dark:text-gray-100 dark:hover:text-gray-300'"
                  />
                </span>
                <span
                  v-if="discussionChannel.archived"
                  class="text-xs text-red-500 dark:text-red-400 border border-red-500 dark:border-red-400 rounded-full px-2"
                  >Archived</span
                >
                <span
                  v-if="discussionChannel.answered"
                  class="text-green-500 dark:text-green-400 mr-1 border dark:border-green-400 border-green-500 rounded-full text-xs flex gap-1 items-center py-0.5 px-2"
                  aria-label="This discussion has been answered"
                > 
                  <CheckCircleIcon class="h-4 w-4" /> Answered
                </span>
              </nuxt-link>
              <div
                class="font-medium text-xs text-gray-600 no-underline dark:text-gray-300"
              >
                <span class="mr-1 text-xs text-gray-500 dark:text-gray-300">{{
                  `Posted ${relativeTimeAgo} by`
                }}</span>
                <UsernameWithTooltip
                  v-if="authorUsername"
                  :is-admin="authorIsAdmin"
                  :is-mod="authorIsMod"
                  :username="authorUsername"
                  :src="authorProfilePicURL ?? ''"
                  :display-name="authorDisplayName ?? ''"
                  :comment-karma="authorCommentKarma"
                  :discussion-karma="authorDiscussionKarma"
                  :account-created="authorAccountCreated"
                />
              </div>
            </div>

            <div
              v-if="discussion?.body"
              class="my-2 dark:bg-black bg-gray-100 px-2 pt-2 pb-4 rounded"
            >
              <MarkdownPreview
                :text="discussion.body"
                :disable-gallery="false"
                :word-limit="50"
                class="ml-2"
              />
            </div>
            <div v-if="discussion.Album" class="my-4 overflow-x-auto bg-black">
              <DiscussionAlbum
                :album="discussion.Album"
                :carousel-format="true"
              />
            </div>
            <div
              class="font-medium my-1 flex space-x-1 text-xs text-gray-600 hover:no-underline"
            >
              <TagComponent
                v-for="tag in tags"
                :key="tag"
                class="my-1"
                :active="selectedTags.includes(tag)"
                :tag="tag"
                @click="$emit('filterByTag', tag)"
              />
            </div>
            <div class="flex items-center dark:text-white gap-2">
              <DiscussionVotes
                v-if="discussionChannel"
                :discussion="discussion"
                :discussion-channel="discussionChannel"
                :show-downvote="false"
              />
              <div class="flex items-center justify-start gap-6">
                <nuxt-link
                  :to="{
                    name: 'forums-forumId-discussions-discussionId',
                    params: {
                      forumId: defaultUniqueName,
                      discussionId: discussionChannel.discussionId,
                    },
                    query: filteredQuery,
                  }"
                  class="py-0.5 rounded-full dark:bg-gray-700 bg-gray-100 px-2 flex items-center gap-2 dark:hover:bg-gray-600"
                >
                  <i class="fa-regular fa-comment" />
                  <span class="text-sm">{{ commentCount }}</span>
                </nuxt-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ErrorBanner v-if="errorMessage" :text="errorMessage" />
  </li>
</template>

<style scoped>
.highlighted {
  background-color: #f9f95d;
}
</style>
