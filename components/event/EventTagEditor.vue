<script lang="ts" setup>
import { computed, type PropType } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_EVENT } from '@/graphQLData/event/mutations';
import InPlaceTagEditor from '@/components/InPlaceTagEditor.vue';
import type { Tag as TagData } from '@/__generated__/graphql';

const props = defineProps({
  eventId: {
    type: String,
    required: true,
  },
  existingTags: {
    type: Array as PropType<TagData[]>,
    required: true,
  },
});

const emit = defineEmits(['refetch', 'done', 'cancel']);

const existingTagStrings = computed(() => {
  return props.existingTags.map((tag) => tag.text);
});

const {
  mutate: updateEvent,
  loading: updateEventLoading,
  error: updateEventError,
  onDone: onUpdateEventDone,
} = useMutation(UPDATE_EVENT);

onUpdateEventDone(() => {
  emit('refetch');
  emit('done');
});

const saveTags = (selectedTags: string[]) => {
  const tagConnections = selectedTags.map((tag: string) => ({
    onCreate: { node: { text: tag } },
    where: { node: { text: tag } },
  }));

  const tagDisconnections = existingTagStrings.value
    .filter((tag: string) => !selectedTags.includes(tag))
    .map((tag: string) => ({
      where: { node: { text: tag } },
    }));

  updateEvent({
    where: { id: props.eventId },
    updateEventInput: {
      Tags: [{ connectOrCreate: tagConnections, disconnect: tagDisconnections }],
    },
  });
};
</script>

<template>
  <InPlaceTagEditor
    :existing-tags="existingTagStrings"
    :loading="updateEventLoading"
    :error="updateEventError?.message || ''"
    @save="saveTags"
    @cancel="emit('cancel')"
  />
</template>
