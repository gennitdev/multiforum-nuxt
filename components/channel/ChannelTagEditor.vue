<script lang="ts" setup>
import { computed, type PropType } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_CHANNEL } from '@/graphQLData/channel/mutations';
import InPlaceTagEditor from '@/components/InPlaceTagEditor.vue';
import type { Tag as TagData } from '@/__generated__/graphql';

const props = defineProps({
  channelUniqueName: {
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
  mutate: updateChannel,
  loading: updateChannelLoading,
  error: updateChannelError,
  onDone: onUpdateChannelDone,
} = useMutation(UPDATE_CHANNEL);

onUpdateChannelDone(() => {
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

  updateChannel({
    where: { uniqueName: props.channelUniqueName },
    update: {
      Tags: [{ connectOrCreate: tagConnections, disconnect: tagDisconnections }],
    },
  });
};
</script>

<template>
  <InPlaceTagEditor
    :existing-tags="existingTagStrings"
    :loading="updateChannelLoading"
    :error="updateChannelError?.message || ''"
    @save="saveTags"
    @cancel="emit('cancel')"
  />
</template>
