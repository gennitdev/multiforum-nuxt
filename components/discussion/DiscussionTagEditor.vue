<script lang="ts" setup>
import { computed, type PropType } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import InPlaceTagEditor from '@/components/InPlaceTagEditor.vue';
import type { Tag as TagData } from '@/__generated__/graphql';

const props = defineProps({
  discussionId: {
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
  mutate: updateDiscussion,
  loading: updateDiscussionLoading,
  error: updateDiscussionError,
  onDone: onUpdateDiscussionDone,
} = useMutation(UPDATE_DISCUSSION);

onUpdateDiscussionDone(() => {
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

  updateDiscussion({
    where: { id: props.discussionId },
    updateDiscussionInput: {
      Tags: [{ connectOrCreate: tagConnections, disconnect: tagDisconnections }],
    },
  });
};
</script>

<template>
  <InPlaceTagEditor
    :existing-tags="existingTagStrings"
    :loading="updateDiscussionLoading"
    :error="updateDiscussionError?.message || ''"
    @save="saveTags"
    @cancel="emit('cancel')"
  />
</template>
