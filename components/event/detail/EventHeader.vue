<script lang="ts" setup>
import { computed, ref } from "vue";
import type { PropType } from "vue";
import { useMutation } from "@vue/apollo-composable";
import type { Event } from "@/__generated__/graphql";
import {
  CANCEL_EVENT,
  DELETE_EVENT,
  ADD_FEEDBACK_COMMENT_TO_EVENT,
} from "@/graphQLData/event/mutations";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import LocationIcon from "@/components/icons/LocationIcon.vue";
import ClipboardIcon from "@/components/icons/ClipboardIcon.vue";
import Notification from "@/components/NotificationComponent.vue";
import { DateTime } from "luxon";
import EllipsisHorizontal from "@/components/icons/EllipsisHorizontal.vue";
import WarningModal from "@/components/WarningModal.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import { getDuration, ALLOWED_ICONS, actionIconMap } from "@/utils";
import GenericFeedbackFormModal from "@/components/GenericFeedbackFormModal.vue";
import BrokenRulesModal from "@/components/mod/BrokenRulesModal.vue";
import { modProfileNameVar, usernameVar } from "@/cache";
import { useRoute, useRouter } from "nuxt/app";
import InfoBanner from "@/components/InfoBanner.vue";
import UnarchiveModal from "@/components/mod/UnarchiveModal.vue";

type MenuItem = {
  label?: string;
  value?: string;
  event?: string;
  icon?: string;
  isDivider?: boolean;
};

const props = defineProps({
  eventData: {
    type: Object as PropType<Event>,
    required: true,
  },
  showMenuButtons: {
    type: Boolean,
    default: true,
  },
  eventIsArchived: {
    type: Boolean,
    default: false,
  },
  eventChannelId: {
    type: String,
    default: "",
  },
});

const route = useRoute();
const router = useRouter();

const showAddressCopiedNotification = ref(false);
const showCopiedLinkNotification = ref(false);
const showFeedbackFormModal = ref(false);
const showFeedbackSubmittedSuccessfully = ref(false);
const confirmDeleteIsOpen = ref(false);
const confirmCancelIsOpen = ref(false);
const showArchiveAndSuspendModal = ref(false);

const showReportEventModal = ref(false);
const showArchiveModal = ref(false);
const showUnarchiveModal = ref(false);
const showSuccessfullyArchived = ref(false);
const showSuccessfullyUnarchived = ref(false);
const showSuccessfullySuspended = ref(false);
const showSuccessfullyArchivedAndSuspended = ref(false);
const showSuccessfullyReported = ref(false);

const eventId = computed(() => {
  return typeof route.params.eventId === "string" ? route.params.eventId : "";
});

const channelId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return props.eventData?.EventChannels?.[0]?.channelUniqueName || "";
});

const permalinkObject = computed(() => {
  if (!eventId.value) return {};
  return {
    name: "forums-forumId-events-eventId",
    params: {
      eventId: eventId.value,
      forumId: channelId.value,
    },
  };
});

const {
  mutate: deleteEvent,
  error: deleteEventError,
  loading: deleteEventLoading,
  onDone: onDoneDeleting,
} = useMutation(DELETE_EVENT, {
  variables: { id: eventId.value },
  update: (cache) => {
    cache.modify({
      fields: {
        events(existingEventRefs = [], { readField }) {
          return existingEventRefs.filter(
            (ref: any) => readField("id", ref) !== eventId.value
          );
        },
      },
    });
  },
});

onDoneDeleting(() => {
  if (channelId.value) {
    router.push({
      name: "forums-forumId-events",
      params: { forumId: channelId.value },
    });
  }
});

const {
  mutate: cancelEvent,
  error: cancelEventError,
  loading: cancelEventLoading,
  onDone: onDoneCanceling,
} = useMutation(CANCEL_EVENT, {
  variables: {
    id: eventId.value,
    updateEventInput: { canceled: true },
    eventWhere: { id: eventId.value },
  },
});

onDoneCanceling(() => {
  confirmCancelIsOpen.value = false;
});

const {
  mutate: addFeedbackCommentToEvent,
  loading: addFeedbackCommentToEventLoading,
  error: addFeedbackCommentToEventError,
  onDone: onAddFeedbackCommentToEventDone,
} = useMutation(ADD_FEEDBACK_COMMENT_TO_EVENT);

onAddFeedbackCommentToEventDone(() => {
  showFeedbackFormModal.value = false;
  showFeedbackSubmittedSuccessfully.value = true;
});

const copyAddress = async () => {
  try {
    const address = props.eventData.address || "";
    await navigator.clipboard.writeText(address);
    showAddressCopiedNotification.value = true;
    setTimeout(() => {
      showAddressCopiedNotification.value = false;
    }, 2000);
  } catch (error) {
    console.error(error);
  }
};

const copyLink = async () => {
  try {
    const basePath = window.location.origin;
    const permalink = `${basePath}${router.resolve(permalinkObject.value).href}`;
    await navigator.clipboard.writeText(permalink);
    showCopiedLinkNotification.value = true;
    setTimeout(() => {
      showCopiedLinkNotification.value = false;
    }, 2000);
  } catch (error) {
    console.error(error);
  }
};

const isAdmin = computed(() => {
  const serverRoles = props.eventData.Poster?.ServerRoles;
  return serverRoles && serverRoles?.length > 0 && serverRoles[0].showAdminTag;
});

const menuItems = computed(() => {
  let items: MenuItem[] = [];
  if (props.eventData && route.name !== "EventFeedback") {
    items.push({
      label: "Copy Link",
      event: "copyLink",
      icon: ALLOWED_ICONS.COPY_LINK,
    });
    items.unshift({
      label: "View Feedback",
      event: "handleViewFeedback",
      icon: ALLOWED_ICONS.VIEW_FEEDBACK,
    });
  }
  if (!usernameVar.value) {
    return items;
  }
  if (props.eventData?.Poster?.username === usernameVar.value) {
    items = items.concat([
      {
        label: "Edit",
        event: "handleEdit",
        icon: ALLOWED_ICONS.EDIT,
      },
      {
        label: "Delete",
        event: "handleDelete",
        icon: ALLOWED_ICONS.DELETE,
      },
      {
        label: "View Feedback",
        event: "handleViewFeedback",
        icon: ALLOWED_ICONS.VIEW_FEEDBACK,
      },
    ]);
    if (!props.eventData.canceled) {
      items.push({
        label: "Cancel",
        event: "handleCancel",
        icon: ALLOWED_ICONS.CANCEL,
      });
    }
  } else {
    items = items.concat([
      {
        value: "Moderation Actions",
        isDivider: true,
      },
      {
        label: "Report",
        event: "handleReport",
        icon: ALLOWED_ICONS.REPORT,
      },
    ]);
    if (route.name !== "EventFeedback") {
      items.push({
        label: "Give Feedback",
        event: "handleFeedback",
        icon: ALLOWED_ICONS.GIVE_FEEDBACK,
      });
    }
    // Only add these if mod permissions are elevated
    if (!props.eventIsArchived) {
      items = items.concat([
        {
          label: "Archive",
          event: "handleClickArchive",
          icon: ALLOWED_ICONS.ARCHIVE,
          value: props.eventData.id,
        },
        {
          label: "Archive and Suspend",
          event: "handleClickArchiveAndSuspend",
          icon: ALLOWED_ICONS.SUSPEND,
          value: props.eventData.id,
        },
      ]);
    } else {
      items = items.concat([
        {
          label: "Unarchive",
          event: "handleClickUnarchive",
          icon: ALLOWED_ICONS.UNARCHIVE,
          value: props.eventData.id,
        },
      ]);
    }
  }
  return items;
});

function getFormattedDateString(startTime: string) {
  // if the event is all day and spans multiple days,
  // include start and end date but not time
  if (props.eventData.isAllDay && props.eventData.endTime) {
    const start = DateTime.fromISO(startTime);
    const end = DateTime.fromISO(props.eventData.endTime);
    if (start.hasSame(end, "day")) {
      return start.toFormat("cccc LLLL d yyyy");
    }
    return `${start.toFormat("cccc LLLL d yyyy")} - ${end.toFormat(
      "cccc LLLL d yyyy"
    )}`;
  }
  return DateTime.fromISO(startTime).toFormat("cccc LLLL d yyyy h:mm a");
}

const feedbackText = ref("");

function handleSubmitFeedback() {
  if (!feedbackText.value) {
    console.error("Feedback text is required");
    return;
  }
  if (!modProfileNameVar.value) {
    console.error("Mod profile name is required to submit feedback");
    return;
  }
  addFeedbackCommentToEvent({
    eventId: eventId.value,
    text: feedbackText.value,
    channelId: channelId.value,
    modProfileName: modProfileNameVar.value,
  });
}

function handleViewFeedback() {
  router.push({
    name: "forums-forumId-events-feedback-eventId",
    params: {
      eventId: eventId.value,
      forumId: channelId.value,
    },
  });
}

function handleFeedbackInput(event: string) {
  feedbackText.value = event;
}
</script>

<template>
  <div>
    <ErrorBanner
      v-if="deleteEventError"
      class="mb-2"
      :text="deleteEventError.message"
    />
    <ErrorBanner
      v-if="cancelEventError"
      class="mb-2"
      :text="cancelEventError.message"
    />

    <div
      class="flex justify-between text-sm pt-2 text-gray-700 dark:text-gray-200 border-b pb-2 mb-4 dark:border-gray-500"
    >
      <ul class="space-y-2">
        <li class="hanging-indent flex items-start">
          <div class="mr-3 h-5 w-5">
            <CalendarIcon />
          </div>
          <span>{{
            `${getFormattedDateString(eventData.startTime)}, ${
              eventData.isAllDay
                ? "all day"
                : getDuration(eventData.startTime, eventData.endTime)
            }`
          }}</span>
        </li>
        <li
          v-if="eventData.virtualEventUrl"
          class="hanging-indent flex items-start"
        >
          <div class="mr-3 h-5 w-5">
            <LinkIcon />
          </div>
          <a
            class="cursor-pointer underline break-all flex-1"
            target="_blank"
            rel="noreferrer"
            :href="eventData.virtualEventUrl"
          >
            {{ eventData.virtualEventUrl }}
          </a>
        </li>
        <li v-if="eventData.address" class="hanging-indent flex items-start">
          <div class="mr-3 h-5 w-5">
            <LocationIcon />
          </div>
          <div class="inline">
            {{ eventData.address }}
            <ClipboardIcon
              class="ml-1 h-4 w-4 cursor-pointer inline-block align-text-bottom"
              @click="copyAddress"
            />
          </div>
        </li>
        <li
          v-if="!eventData.free && eventData.cost && eventData.cost !== '0'"
          class="hanging-indent flex items-start"
        >
          <div class="h-5 w-5">
            <i class="fa-solid fa-ticket h-5" />
          </div>
          <MarkdownPreview
            class="flex-1 -ml-2"
            :disable-gallery="true"
            :text="eventData.cost"
          />
        </li>
        <li
          v-if="eventData.isHostedByOP && eventData.Poster"
          class="hanging-indent flex items-start"
        >
          <div class="mr-3 h-5 w-5">
            <i class="fa-regular fa-user h-5" />
          </div>
          <nuxt-link
            :to="{
              name: 'u-username',
              params: { username: eventData.Poster.username },
            }"
          >
            Hosted by
            <UsernameWithTooltip
              v-if="eventData.Poster.username"
              :is-admin="isAdmin || false"
              :username="eventData.Poster.username"
              :src="eventData.Poster.profilePicURL ?? ''"
              :display-name="eventData.Poster.displayName || ''"
              :comment-karma="eventData.Poster.commentKarma ?? 0"
              :discussion-karma="eventData.Poster.discussionKarma ?? 0"
              :account-created="eventData.Poster.createdAt"
            />
          </nuxt-link>
        </li>
      </ul>
      <div>
        <MenuButton
          v-if="showMenuButtons && eventData && menuItems.length > 0"
          :data-testid="'event-menu-button'"
          :items="menuItems"
          @copy-link="copyLink"
          @handle-edit="
            router.push(`/forums/${channelId}/events/edit/${eventId}`)
          "
          @handle-delete="confirmDeleteIsOpen = true"
          @handle-cancel="confirmCancelIsOpen = true"
          @handle-report="showReportEventModal = true"
          @handle-feedback="showFeedbackFormModal = true"
          @handle-view-feedback="handleViewFeedback"
          @handle-click-archive="showArchiveModal = true"
          @handle-click-archive-and-suspend="showArchiveAndSuspendModal = true"
          @handle-click-unarchive="showUnarchiveModal = true"
        >
          <EllipsisHorizontal
            class="h-6 w-6 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
          />
        </MenuButton>
      </div>
      <Notification
        :show="showAddressCopiedNotification"
        :title="'Copied to clipboard!'"
        @close-notification="showAddressCopiedNotification = false"
      />
      <Notification
        :show="showCopiedLinkNotification"
        :title="'Copied to clipboard!'"
        @close-notification="showCopiedLinkNotification = false"
      />
      <WarningModal
        :title="'Delete Event'"
        :body="'Are you sure you want to delete this event?'"
        :open="confirmDeleteIsOpen"
        :loading="deleteEventLoading"
        @close="confirmDeleteIsOpen = false"
        @primary-button-click="deleteEvent"
      />
      <WarningModal
        v-if="confirmCancelIsOpen"
        :title="'Cancel Event'"
        :body="'Are you sure you want to cancel this event? This action cannot be undone.'"
        :open="confirmCancelIsOpen"
        :primary-button-text="'Yes, cancel the event'"
        :secondary-button-text="'No'"
        :loading="cancelEventLoading"
        :error="cancelEventError?.message"
        @close="confirmCancelIsOpen = false"
        @primary-button-click="cancelEvent"
      />
      <GenericFeedbackFormModal
        :open="showFeedbackFormModal"
        :error="addFeedbackCommentToEventError?.message"
        :loading="addFeedbackCommentToEventLoading"
        @update-feedback="handleFeedbackInput"
        @close="showFeedbackFormModal = false"
        @primary-button-click="handleSubmitFeedback"
      />
      <BrokenRulesModal
        v-if="eventData"
        :title="'Suspend Event Submitter'"
        :open="showArchiveAndSuspendModal"
        :event-title="eventData.title"
        :event-id="eventData.id"
        :event-channel-id="eventChannelId"
        :suspend-user-enabled="true"
        :text-box-label="'(Optional) Explain why you are suspending the event submitter:'"
        @close="showArchiveAndSuspendModal = false"
        @suspended-user-successfully="
          () => {
            showSuccessfullyArchivedAndSuspended = true;
            showArchiveAndSuspendModal = false;
          }
        "
      />
      <Notification
        :show="showSuccessfullyArchivedAndSuspended"
        :title="'Archived the post and suspended the author.'"
        @close-notification="showSuccessfullyArchivedAndSuspended = false"
      />
      <Notification
        :show="showFeedbackSubmittedSuccessfully"
        :title="'Your feedback has been recorded. Thank you!'"
        @close-notification="showFeedbackSubmittedSuccessfully = false"
      />
      <BrokenRulesModal
        :open="showReportEventModal"
        :event-title="eventData.title"
        :event-id="eventId"
        @close="showReportEventModal = false"
        @report-submitted-successfully="
          () => {
            showSuccessfullyReported = true;
            showReportEventModal = false;
          }
        "
      />
      <BrokenRulesModal
        :v-if="eventData && eventData.id"
        :open="showArchiveModal"
        :event-title="eventData?.title"
        :event-id="eventData?.id"
        :archive-after-reporting="true"
        :event-channel-id="eventChannelId"
        @close="showArchiveModal = false"
        @reported-and-archived-successfully="
          () => {
            showSuccessfullyArchived = true;
            showArchiveModal = false;
            $emit('archived-successfully');
          }
        "
      />
      <UnarchiveModal
        v-if="eventChannelId && eventData?.id"
        :open="showUnarchiveModal"
        :event-channel-id="eventChannelId"
        :event-id="eventData?.id"
        @close="showUnarchiveModal = false"
        @unarchived-successfully="
          () => {
            showSuccessfullyUnarchived = true;
            showUnarchiveModal = false;
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
        :title="'The event was archived successfully.'"
        @close-notification="showSuccessfullyArchived = false"
      />
      <Notification
        :show="showSuccessfullyUnarchived"
        :title="'The event was unarchived successfully.'"
        @close-notification="showSuccessfullyUnarchived = false"
      />
      <Notification
        :show="showSuccessfullySuspended"
        :title="'The event was suspended successfully.'"
        @close-notification="showSuccessfullySuspended = false"
      />
    </div>
    <InfoBanner
      v-if="eventData.virtualEventUrl"
      class="mx-4"
      :text="`The official event page is on an external website. Refer to the [official event page](${eventData.virtualEventUrl}) for the most complete, correct and up-to-date information.`"
    />
  </div>
</template>
