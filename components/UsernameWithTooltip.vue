<script lang="ts">
import { defineComponent } from "vue";
import { timeAgo } from "@/utils";

export default defineComponent({
  name: "UsernameWithTooltip",
  props: {
    username: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: false,
      default: "",
    },
    src: {
      type: String,
      required: false,
      default: "",
    },
    accountCreated: {
      type: String,
      required: false,
      default: "",
    },
    commentKarma: {
      type: Number,
      required: false,
      default: 0,
    },
    discussionKarma: {
      type: Number,
      required: false,
      default: 0,
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
    isMod: {
      type: Boolean,
      required: false,
      default: false,
    },
    isOriginalPoster: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    return {
      timeAgo,
    };
  },
});
</script>
<template>
  <client-only>
  <v-tooltip
    location="bottom"
    content-class="custom-tooltip"
  >
    <template #activator="{ props }">
      <button v-bind="props">
        <slot>
          <div class="flex flex-row items-center gap-1">
            <nuxt-link
              :to="{
                name: 'u-username',
                params: { username },
              }"
              class="flex flex-row items-center gap-1 hover:underline"
            >
              <span
                v-if="!displayName"
                class="font-bold"
              >{{ username }}</span>
              <span
                v-if="displayName"
                class="font-bold"
              >{{
                displayName
              }}</span>
              <span
                v-if="displayName"
                class="text-gray-500 dark:text-gray-300"
              >{{ `(u/${username})` }}</span>
            </nuxt-link>
            <span
              v-if="isAdmin"
              class="rounded-md border border-gray-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
            >Admin</span>
            <span
              v-else-if="isMod"
              class="rounded-md border border-blue-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
            >
              Mod
            </span>
            <span
              v-if="isOriginalPoster"
              class="rounded-md border border-gray-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
            >OP</span>
          </div>
        </slot>
      </button>
    </template>
    <template #default>
      <div>
        <div
          v-if="!displayName"
          class="text-md flex w-full flex-col"
        >
          <AvatarComponent
            :text="username"
            :src="src"
            :is-medium="true"
          />{{ username }}
        </div>
        <div
          v-if="displayName"
          class="text-md flex w-full flex-col"
        >
          <AvatarComponent
            :text="username"
            :src="src"
            :is-medium="true"
          />
          <p class="text-xs font-bold">
            {{ displayName }}
          </p>
          <p class="text-xs text-gray-600 dark:text-white">
            {{ `u/${username}` }}
          </p>
        </div>
        <ul class="text-xs">
          <li>
            {{ `account created ${timeAgo(new Date(accountCreated))}` }}
          </li>
          <li>{{ `${commentKarma ?? 0} comment karma` }}</li>
          <li>{{ `${discussionKarma ?? 0} discussion karma` }}</li>
        </ul>
      </div>
    </template>
  </v-tooltip>
</client-only>
</template>
