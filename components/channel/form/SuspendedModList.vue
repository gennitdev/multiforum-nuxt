<script setup lang="ts">
import { computed } from "vue";
import { GET_SUSPENDED_MODS_BY_CHANNEL } from "@/graphQLData/mod/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";

const route = useRoute();
const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const { result, loading, error } = useQuery(
  GET_SUSPENDED_MODS_BY_CHANNEL,
  () => ({
    channelUniqueName: forumId.value,
  }),
  {
    fetchPolicy: "cache-first",
  }
);
const suspensions = computed(
  () => result.value?.channels[0]?.SuspendedMods ?? []
);
const aggregateCount = computed(
  () => result.value?.channels[0]?.SuspendedModsAggregate?.count ?? 0
);

defineEmits(["click-remove-mod"]);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div
      v-else-if="
        result?.channels?.length === 0 ||
        result.channels[0]?.SuspendedMods?.length === 0
      "
      class="text-sm"
    >
      There are no active mod suspensions.
    </div>

    <div
      v-if="suspensions && suspensions.length > 0"
      class="flex-col text-sm font-bold"
    >
      <div class="text-sm">
        {{ `Active Suspensions (${aggregateCount})` }}
      </div>
      <div class="text-sm">
        {{ `Active Suspensions (${aggregateCount})` }}
      </div>
      <div
        v-for="suspension in suspensions"
        :key="suspension.username"
        class="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
      >
        <nuxt-link
          :to="{
            name: 'mod-modId',
            params: { modId: suspension?.SuspendedMod?.displayName },
          }"
          class="flex items-center dark:text-white"
        >
          <AvatarComponent
            :text="suspension?.SuspendedMod?.displayName"
            class="mr-2 h-6 w-6"
          />
          <span class="text-sm font-bold">{{
            `${suspension?.SuspendedMod?.displayName} ${suspension?.username ? `(${suspension?.username})` : ""}`
          }}</span>
        </nuxt-link>
        <button
          type="button"
          class="flex rounded border border-blue-500 px-2 py-1 text-blue-500 items-center gap-1"
          @click="$emit('click-remove-mod', suspension?.username)"
        >
          Remove Mod
        </button>
      </div>
    </div>
  </div>
</template>
