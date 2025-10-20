<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import { stableRelativeTime } from '@/utils';
import {
  DELETE_DISCUSSION,
  UPDATE_DISCUSSION_SENSITIVE_CONTENT,
} from '@/graphQLData/discussion/mutations';
import { UPDATE_CHANNEL } from '@/graphQLData/channel/mutations';
import WarningModal from '@/components/WarningModal.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import Notification from '@/components/NotificationComponent.vue';
import BrokenRulesModal from '@/components/mod/BrokenRulesModal.vue';
import EllipsisHorizontal from '@/components/icons/EllipsisHorizontal.vue';
import { getDiscussionHeaderMenuItems } from '@/utils/headerPermissionUtils';
import { usernameVar } from '@/cache';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import UnarchiveModal from '@/components/mod/UnarchiveModal.vue';
import { useChannelPermissions } from '@/composables/useChannelPermissions';
import EditsDropdown from './activityFeed/EditsDropdown.vue';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';

const props = defineProps<{
  discussion: Discussion | null;
  discussionChannelId?: string;
  compactMode?: boolean;
  channelId?: string | null;
  showActionMenu?: boolean;
  discussionBodyEditMode?: boolean;
  discussionIsArchived?: boolean | undefined | null;
  downloadMode?: boolean;
}>();

const emit = defineEmits([
  'handleClickGiveFeedback',
  'handleClickEditBody',
  'cancelEditDiscussionBody',
  'handleClickAddAlbum',
]);

const route = useRoute();
const router = useRouter();

const editedAt = computed(() => {
  if (!props.discussion?.updatedAt) return '';
  return `Edited ${stableRelativeTime(props.discussion.updatedAt)}`;
});

const createdAt = computed(() => {
  if (!props.discussion?.createdAt) return '';
  return `Posted ${stableRelativeTime(props.discussion.createdAt)}`;
});

const {
  mutate: deleteDiscussion,
  loading: deleteDiscussionLoading,
  error: deleteDiscussionError,
  onDone: onDoneDeleting,
} = useMutation(DELETE_DISCUSSION, {
  variables: { id: props.discussion?.id },
  update: (cache, { data }) => {
    if (data?.deleteDiscussions?.nodesDeleted > 0) {
      cache.evict({
        id: cache.identify({
          __typename: 'Discussion',
          id: props.discussion?.id,
        }),
      });
    }
  },
});

const hasDownload = route.name
  ? route.name.toString().includes('downloads')
  : false;

onDoneDeleting(() => {
  if (props.channelId) {
    if (hasDownload) {
      router.push({
        name: 'forums-forumId-downloads',
        params: { forumId: props.channelId },
      });
      return;
    }
    router.push({
      name: 'forums-forumId-discussions',
      params: { forumId: props.channelId },
    });
  }
});

const { mutate: updateSensitiveContent, error: updateSensitiveContentError } =
  useMutation(UPDATE_DISCUSSION_SENSITIVE_CONTENT);

const handleToggleSensitiveContent = async () => {
  if (!props.discussion?.id) return;

  try {
    await updateSensitiveContent({
      discussionId: props.discussion.id,
      hasSensitiveContent: !props.discussion.hasSensitiveContent,
    });
    showSuccessfullyUpdatedSensitiveContent.value = true;
  } catch (error) {
    console.error('Error updating sensitive content:', error);
  }
};

const defaultChannel = computed(() => {
  if (!props.discussion) {
    return '';
  }
  const channelInRoute = route.params.forumId;
  return (
    channelInRoute ||
    props.discussion?.DiscussionChannels?.[0]?.channelUniqueName
  );
});

// Use composable for permission checking
const { userPermissions, channel } = useChannelPermissions({
  channelId: computed(() => (props.channelId || defaultChannel.value) as string),
});

const permalinkObject = computed(() => {
  if (!props.discussion) return {};
  return {
    name: 'forums-forumId-discussions-discussionId',
    params: {
      discussionId: props.discussion.id,
      forumId: defaultChannel.value,
    },
  };
});

const showCopiedLinkNotification = ref(false);

const copyLink = async () => {
  try {
    let basePath = '';
    if (import.meta.client) {
      basePath = window.location.origin;
    } else {
      basePath = process.env.BASE_URL || '';
    }
    const permalink = `${basePath}${router.resolve(permalinkObject.value).href}`;
    await navigator.clipboard.writeText(permalink);
    showCopiedLinkNotification.value = true;
  } catch (e) {
    console.error(e);
  }
  setTimeout(() => {
    showCopiedLinkNotification.value = false;
  }, 2000);
};
const deleteModalIsOpen = ref(false);

const showBrokenRulesModal = ref(false);
const showArchiveModal = ref(false);
const showUnarchiveModal = ref(false);
const showArchiveAndSuspendModal = ref(false);

const showSuccessfullyReported = ref(false);
const showSuccessfullyArchived = ref(false);
const showSuccessfullyUnarchived = ref(false);
const showSuccessfullyArchivedAndSuspended = ref(false);
const showSuccessfullyUpdatedSensitiveContent = ref(false);
const showSuccessfullyPinned = ref(false);
const showSuccessfullyUnpinned = ref(false);

// Check if the discussion is pinned in the current channel
const isPinned = computed(() => {
  if (!props.discussionChannelId || !channel.value) {
    return false;
  }
  const pinnedDiscussionChannels =
    channel.value.PinnedDiscussionChannels || [];
  return pinnedDiscussionChannels.some(
    (dc: DiscussionChannel) => dc.id === props.discussionChannelId
  );
});

const menuItems = computed(() => {
  if (!props.discussion) {
    return [];
  }

  // Use our utility function to get the menu items
  return getDiscussionHeaderMenuItems({
    isOwnDiscussion: props.discussion?.Author?.username === usernameVar.value,
    isArchived: !!props.discussionIsArchived,
    userPermissions: userPermissions.value,
    isLoggedIn: !!usernameVar.value,
    discussionId: props.discussion.id,
    hasAlbum: !!props.discussion?.Album?.Images?.length,
    feedbackEnabled: channel.value?.feedbackEnabled ?? true,
    hasSensitiveContent: !!props.discussion?.hasSensitiveContent,
    isPinned: isPinned.value,
  });
});

const authorIsAdmin = computed(
  () => props.discussion?.Author?.ServerRoles?.[0]?.showAdminTag || false
);
const authorIsMod = computed(
  () => props.discussion?.Author?.ChannelRoles?.[0]?.showModTag || false
);

const warningModalTitle = computed(() => {
  if (hasDownload) {
    return 'Are you sure you want to delete this download?';
  }

  return 'Are you sure you want to delete this discussion?';
});

const warningModalBody = computed(() => {
  if (hasDownload) {
    return 'This action will permanently delete the download.';
  }

  return 'This action will permanently delete the discussion.';
});

// Pin/Unpin handlers
const {
  mutate: updateChannel,
  error: updateChannelError,
  onDone: onUpdateChannelDone,
} = useMutation(UPDATE_CHANNEL);

onUpdateChannelDone(() => {
  if (isPinned.value) {
    showSuccessfullyUnpinned.value = true;
    setTimeout(() => {
      showSuccessfullyUnpinned.value = false;
    }, 3000);
  } else {
    showSuccessfullyPinned.value = true;
    setTimeout(() => {
      showSuccessfullyPinned.value = false;
    }, 3000);
  }
});

const handlePin = () => {
  if (!props.discussionChannelId || !props.channelId) return;

  updateChannel({
    where: { uniqueName: props.channelId || defaultChannel.value },
    update: {
      PinnedDiscussionChannels: [
        {
          connect: [{ where: { node: { id: props.discussionChannelId } } }],
        },
      ],
    },
  });
};

const handleUnpin = () => {
  if (!props.discussionChannelId || !props.channelId) return;

  updateChannel({
    where: { uniqueName: props.channelId || defaultChannel.value },
    update: {
      PinnedDiscussionChannels: [
        {
          disconnect: [{ where: { node: { id: props.discussionChannelId } } }],
        },
      ],
    },
  });
};
</script>

<template>
  <div>
    <div class="mt-2 flex justify-between">
      <div
        class="flex flex-wrap items-center space-x-2 text-xs dark:text-white"
      >
        <AvatarComponent
          :text="discussion?.Author?.username ?? '[Deleted]'"
          :src="discussion?.Author?.profilePicURL ?? ''"
          :is-small="true"
        />
        <nuxt-link
          v-if="discussion?.Author"
          class="cursor-pointer font-bold text-black hover:underline dark:text-white"
          :to="{
            name: 'u-username',
            params: { username: discussion.Author.username },
          }"
        >
          <span class="flex flex-row items-center gap-1">
            <span v-if="!discussion.Author.displayName" class="font-bold">{{
              discussion.Author.username
            }}</span>
            <span v-else class="font-bold">{{
              discussion.Author.displayName
            }}</span>
            <span
              v-if="discussion.Author.displayName"
              class="text-gray-500 dark:text-gray-300"
              >{{ `(u/${discussion.Author.username})` }}</span
            >

            <span
              v-if="authorIsAdmin"
              class="rounded-md border border-gray-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
              >Admin</span
            >
            <span
              v-else-if="authorIsMod"
              class="rounded-md border border-orange-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
              >Mod</span
            >
          </span>
        </nuxt-link>
        <span v-else>[Deleted]</span>
        <div>{{ createdAt }}</div>
        <span v-if="discussion?.updatedAt" class="mx-2">&#8226;</span>
        <div class="flex items-center">
          <span>{{ editedAt }}</span>
          <EditsDropdown
            v-if="discussion && (discussion.PastBodyVersions?.length ?? 0) > 0"
            class="ml-2"
            :discussion="discussion"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div
          v-if="usernameVar === discussion?.Author?.username && !downloadMode"
        >
          <button
            v-if="!discussionBodyEditMode"
            type="button"
            class="align-items flex gap-2 text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
            @click="$emit('handleClickEditBody')"
          >
            Edit
          </button>
          <button
            v-else-if="usernameVar"
            type="button"
            class="text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
            @click="$emit('cancelEditDiscussionBody')"
          >
            Cancel
          </button>
        </div>
        <AddToDiscussionFavorites
          v-if="discussion"
          :allow-add-to-list="true"
          :discussion-id="discussion.id"
          :discussion-title="discussion.title"
          size="small"
        />
        <MenuButton
          v-if="showActionMenu && discussion && menuItems.length > 0"
          :items="menuItems"
          :data-testid="'discussion-menu-button'"
          @copy-link="copyLink"
          @handle-edit="
            router.push(
              discussion.hasDownload
                ? `/forums/${channelId}/downloads/edit/${discussion.id}`
                : `/forums/${channelId}/discussions/edit/${discussion.id}`
            )
          "
          @handle-delete="deleteModalIsOpen = true"
          @handle-click-report="showBrokenRulesModal = true"
          @handle-click-archive="showArchiveModal = true"
          @handle-click-archive-and-suspend="showArchiveAndSuspendModal = true"
          @handle-click-unarchive="showUnarchiveModal = true"
          @handle-feedback="emit('handleClickGiveFeedback')"
          @handle-add-album="emit('handleClickAddAlbum')"
          @handle-toggle-sensitive-content="handleToggleSensitiveContent"
          @handle-pin="handlePin"
          @handle-unpin="handleUnpin"
          @handle-view-feedback="
            router.push({
              name: 'forums-forumId-discussions-feedback-discussionId',
              params: {
                forumId: defaultChannel,
                discussionId: discussion.id,
              },
            })
          "
        >
          <EllipsisHorizontal
            class="h-6 w-6 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
          />
        </MenuButton>
      </div>
    </div>
    <WarningModal
      :title="warningModalTitle"
      :body="warningModalBody"
      :open="deleteModalIsOpen"
      :icon="'trash'"
      :loading="deleteDiscussionLoading"
      @close="deleteModalIsOpen = false"
      @primary-button-click="deleteDiscussion"
    />
    <BrokenRulesModal
      v-if="discussion"
      :open="showBrokenRulesModal"
      :discussion-title="discussion?.title"
      :discussion-id="discussion?.id"
      :archive-after-reporting="false"
      @close="showBrokenRulesModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showBrokenRulesModal = false;
        }
      "
    />
    <BrokenRulesModal
      :v-if="discussion"
      :open="showArchiveModal"
      :discussion-title="discussion?.title"
      :discussion-id="discussion?.id"
      :archive-after-reporting="true"
      :discussion-channel-id="discussionChannelId"
      @close="showArchiveModal = false"
      @reported-and-archived-successfully="
        () => {
          showSuccessfullyArchived = true;
          showArchiveModal = false;
        }
      "
    />
    <UnarchiveModal
      v-if="discussionChannelId && discussion?.id"
      :open="showUnarchiveModal"
      :discussion-channel-id="discussionChannelId"
      :discussion-id="discussion?.id"
      @close="showUnarchiveModal = false"
      @unarchived-successfully="
        () => {
          showSuccessfullyUnarchived = true;
          showUnarchiveModal = false;
        }
      "
    />
    <BrokenRulesModal
      v-if="discussion"
      :title="'Suspend Author'"
      :open="showArchiveAndSuspendModal"
      :discussion-title="discussion.title"
      :discussion-id="discussion.id"
      :discussion-channel-id="discussionChannelId"
      :suspend-user-enabled="true"
      :text-box-label="'(Optional) Explain why you are suspending this author:'"
      @close="showArchiveAndSuspendModal = false"
      @suspended-user-successfully="
        () => {
          showSuccessfullyArchivedAndSuspended = true;
          showArchiveAndSuspendModal = false;
        }
      "
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @close-notification="showSuccessfullyReported = false"
    />
    <Notification
      :show="showSuccessfullyArchived"
      :title="'The content was reported and archived successfully.'"
      @close-notification="showSuccessfullyArchived = false"
    />
    <Notification
      :show="showSuccessfullyArchivedAndSuspended"
      :title="'Archived the post and suspended the author.'"
      @close-notification="showSuccessfullyArchivedAndSuspended = false"
    />
    <Notification
      :show="showSuccessfullyUnarchived"
      :title="'The content was unarchived successfully.'"
      @close-notification="showSuccessfullyUnarchived = false"
    />
    <Notification
      :show="showSuccessfullyUpdatedSensitiveContent"
      :title="'Sensitive content setting updated successfully.'"
      @close-notification="showSuccessfullyUpdatedSensitiveContent = false"
    />
    <Notification
      :show="showSuccessfullyPinned"
      :title="'Discussion pinned successfully.'"
      @close-notification="showSuccessfullyPinned = false"
    />
    <Notification
      :show="showSuccessfullyUnpinned"
      :title="'Discussion unpinned successfully.'"
      @close-notification="showSuccessfullyUnpinned = false"
    />
    <ErrorBanner
      v-if="deleteDiscussionError"
      class="mt-2"
      :text="deleteDiscussionError.message"
    />
    <ErrorBanner
      v-if="updateSensitiveContentError"
      class="mt-2"
      :text="updateSensitiveContentError.message"
    />
    <ErrorBanner
      v-if="updateChannelError"
      class="mt-2"
      :text="updateChannelError.message"
    />
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @close-notification="showCopiedLinkNotification = false"
    />
  </div>
</template>
