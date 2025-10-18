<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import Tag from '@/components/TagComponent.vue';
import type { Channel, Tag as TagData } from '@/__generated__/graphql';
import ChannelRules from '@/components/channel/Rules.vue';
import SidebarEventList from '@/components/channel/SidebarEventList.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import { useRouter, useRoute } from 'nuxt/app';
import FontSizeControl from '@/components/channel/FontSizeControl.vue';
import BecomeAdminModal from '@/components/channel/BecomeAdminModal.vue';
import AddToChannelFavorites from '@/components/favorites/AddToChannelFavorites.vue';
import { isAuthenticatedVar, usernameVar, modProfileNameVar } from '@/cache';
import { checkPermission } from '@/utils/permissionUtils';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_CHANNEL } from '@/graphQLData/channel/mutations';
import TagPicker from '@/components/TagPicker.vue';

const props = defineProps({
  channel: {
    type: Object as PropType<Channel>,
    required: true,
  },
  useScrollbar: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['refetchChannelData']);

const route = useRoute();
const router = useRouter();
const showBecomeAdminModal = ref(false);
const eventChannelsAggregate = computed(() => {
  return props.channel?.EventChannelsAggregate?.count ?? 0;
});

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const channelRules = computed(() => props.channel?.rules ?? '');

// Check if we're on the discussion detail page (including comment permalinks)
const isDiscussionDetailPage = computed(() => {
  return (
    typeof route.name === 'string' &&
    route.name.includes('forums-forumId-discussions-discussionId')
  );
});

const filterChannelsByTag = (tag: string) => {
  router.push({
    name: 'forums',
    query: { tag },
  });
};

const openBecomeAdminModal = () => {
  showBecomeAdminModal.value = true;
};

const closeBecomeAdminModal = () => {
  showBecomeAdminModal.value = false;
};

const handleBecomeAdminSuccess = () => {
  emit('refetchChannelData');
};

// Tag editing functionality
const isEditingTags = ref(false);
const selectedTags = ref<string[]>([]);

// Check if user has permission to update channel
const canUpdateChannel = computed(() => {
  if (!isAuthenticatedVar.value || !props.channel) {
    return false;
  }

  const username = usernameVar.value;
  const modProfileName = modProfileNameVar.value;

  // Check if user is channel admin (bypass permission check)
  const isChannelAdmin = props.channel.Admins?.some(
    (admin) => admin.username === username
  );

  if (isChannelAdmin) {
    return true;
  }

  // Check canUpdateChannel permission from role
  return checkPermission({
    permissionData: props.channel,
    standardModRole: props.channel.DefaultChannelRole,
    elevatedModRole: null, // User permissions don't use elevated mod role
    username,
    modProfileName,
    action: 'canUpdateChannel',
  });
});

// Show tags section if there are tags OR if user can edit tags
const showTagsSection = computed(() => {
  return (props.channel?.Tags?.length ?? 0) > 0 || canUpdateChannel.value;
});

const existingTags = computed(() => {
  return props.channel?.Tags?.map((tag: TagData) => tag.text) || [];
});

const startEditingTags = () => {
  selectedTags.value = [...existingTags.value];
  isEditingTags.value = true;
};

const cancelEditingTags = () => {
  isEditingTags.value = false;
  selectedTags.value = [];
};

const {
  mutate: updateChannel,
  loading: updateChannelLoading,
  error: updateChannelError,
  onDone: onUpdateChannelDone,
} = useMutation(UPDATE_CHANNEL);

onUpdateChannelDone(() => {
  isEditingTags.value = false;
  selectedTags.value = [];
  emit('refetchChannelData');
});

const saveTags = () => {
  if (!props.channel?.uniqueName) return;

  const tagConnections = selectedTags.value.map((tag: string) => ({
    onCreate: { node: { text: tag } },
    where: { node: { text: tag } },
  }));

  const tagDisconnections = existingTags.value
    .filter((tag: string) => !selectedTags.value.includes(tag))
    .map((tag: string) => ({
      where: { node: { text: tag } },
    }));

  updateChannel({
    where: { uniqueName: props.channel.uniqueName },
    update: {
      Tags: [{ connectOrCreate: tagConnections, disconnect: tagDisconnections }],
    },
  });
};

const updateSelectedTags = (tags: string[]) => {
  selectedTags.value = tags;
};
</script>

<template>
  <div
    :class="[useScrollbar ? 'max-h-screen overflow-auto' : '']"
    class="pb-8 pt-4"
  >
    <div v-if="channelId && channel" class="items-center gap-2" />

    <div>
      <div class="flex justify-between">
        <ExpandableImage
          v-if="channel?.channelIconURL"
          class="h-20 w-20 dark:border-gray-800"
          :rounded="true"
          :full-width="true"
          :alt="channelId"
          :src="channel?.channelIconURL ?? ''"
        />
        <AvatarComponent
          v-if="!channel?.channelIconURL"
          class="h-20 w-20 dark:border-gray-800"
          :text="channelId"
          :src="channel?.channelIconURL ?? ''"
          :full-width="true"
          :is-square="false"
        />
      </div>
      <div class="flex w-full items-center gap-4">
        <div v-if="channelId" class="flex items-center">
          <div class="mb-1 mt-3 flex-1">
            <span
              class="flex space-y-2 rounded-full border-gray-700 text-xl leading-6 text-black dark:bg-gray-900 dark:text-gray-200"
            >
              {{ channel?.displayName ? channel.displayName : channelId }}
            </span>
            <span
              v-if="channel?.uniqueName && channel?.displayName"
              class="rounded-full bg-white font-mono text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-300"
            >
              {{ `${channel.uniqueName}` }}
            </span>
          </div>
        </div>
        <div class="flex items-center">
          <AddToChannelFavorites
            :allow-add-to-list="true"
            :channel-unique-name="channelId"
            :channel-display-name="channel?.displayName || ''"
            size="medium"
          />
        </div>
      </div>
      <MarkdownPreview
        v-if="channel?.description"
        :text="channel?.description"
        :word-limit="1000"
      />
      <p v-else class="text-xs dark:text-white">Welcome to {{ channelId }}!</p>
    </div>

    <slot />

    <div class="w-full">
      <div v-if="channel">
        <div class="mt-6 flex w-full flex-col gap-6">
          <div v-if="channelRules && channelRules !== '[]'" :key="channelRules">
            <span
              class="my-2 mb-2 flex items-center text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
            >
              <i class="fa-solid fa-scroll mr-2" />Forum Rules
            </span>
            <ChannelRules :rules="channelRules" />
          </div>

          <SidebarEventList
            :event-channels-aggregate="eventChannelsAggregate"
          />

          <div v-if="showTagsSection">
            <div class="flex items-center justify-between border-gray-300">
              <span
                class="my-2 mb-2 flex items-center text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
              >
                <i class="fa-solid fa-tags mr-2" />Tags
              </span>
              <button
                v-if="canUpdateChannel && !isEditingTags"
                class="text-xs text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
                @click="startEditingTags"
              >
                <i class="fa-solid fa-pen-to-square mr-1" />
                Edit
              </button>
            </div>

            <!-- View Mode -->
            <div v-if="!isEditingTags" class="mb-6 mt-2 flex flex-wrap gap-2">
              <Tag
                v-for="tag in channel.Tags"
                :key="tag.text"
                class="mb-1"
                :tag="tag.text"
                @click="filterChannelsByTag(tag.text)"
              />
              <p
                v-if="channel.Tags.length === 0 && canUpdateChannel"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                No tags yet. Click Edit to add tags.
              </p>
            </div>

            <!-- Edit Mode -->
            <div v-else class="mb-6 mt-2">
              <TagPicker
                :selected-tags="selectedTags"
                description=""
                @set-selected-tags="updateSelectedTags"
              />

              <!-- Error Message -->
              <div
                v-if="updateChannelError"
                class="mt-2 text-sm text-red-500 dark:text-red-400"
              >
                Failed to save tags: {{ updateChannelError.message }}
              </div>

              <!-- Action Buttons -->
              <div class="mt-3 flex gap-2">
                <button
                  class="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                  :disabled="updateChannelLoading"
                  @click="saveTags"
                >
                  {{ updateChannelLoading ? 'Saving...' : 'Save' }}
                </button>
                <button
                  class="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  :disabled="updateChannelLoading"
                  @click="cancelEditingTags"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <FontSizeControl v-if="isDiscussionDetailPage" class="mb-6" />

          <div class="flex justify-between">
            <span
              class="my-2 flex items-center text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
            >
              <i class="fa-solid fa-user-shield mr-2" />Admins
            </span>
          </div>

          <div
            v-if="channel.Admins.length > 0"
            class="flex-col space-y-2 text-sm font-bold"
          >
            <div v-for="admin in channel.Admins" :key="admin.username">
              <nuxt-link
                :to="{
                  name: 'u-username',
                  params: { username: admin.username },
                }"
                class="flex items-center dark:text-white"
              >
                <AvatarComponent
                  :text="admin.username"
                  :src="admin.profilePicURL ?? ''"
                  class="mr-2 h-6 w-6"
                />
                <span class="flex flex-row items-center gap-1">
                  <span v-if="!admin.displayName" class="font-bold">{{
                    admin.username
                  }}</span>
                  <span v-else class="font-bold">{{ admin.displayName }}</span>
                  <span
                    v-if="admin.displayName"
                    class="text-gray-500 dark:text-gray-300"
                    >{{ `(u/${admin.username})` }}</span
                  >
                </span>
              </nuxt-link>
            </div>
          </div>

          <div v-else class="my-3 mb-6">
            <p class="mb-3 text-sm dark:text-gray-400">
              This forum does not have any admins.
            </p>
            <button
              v-if="isAuthenticatedVar"
              class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-600"
              @click="openBecomeAdminModal"
            >
              Become an admin of this forum
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Become Admin Modal -->
    <BecomeAdminModal
      :channel-unique-name="channelId"
      :open="showBecomeAdminModal"
      @close="closeBecomeAdminModal"
      @success="handleBecomeAdminSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
/* Apply the user's preferred color scheme by default */
@media (prefers-color-scheme: dark) {
  #md-editor-v3-preview,
  #md-editor-v3-preview-wrapper {
    background-color: black;
  }
}

@media (prefers-color-scheme: light) {
  #md-editor-v3-preview,
  #md-editor-v3-preview-wrapper {
    background-color: orange;
  }
}
</style>
