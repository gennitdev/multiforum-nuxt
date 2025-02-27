<script lang="ts" setup>
import { defineProps } from "vue";
// import { useMutation } from "@vue/apollo-composable";
// import { MARK_AS_ANSWERED, MARK_AS_UNANSWERED } from "@/graphQLData/discussion/mutations";
// export const MARK_AS_ANSWERED = gql`
//   mutation markAsAnswered(
//     $commentId: ID!
//     $channelId: String!
//     $discussionId: ID!
//   ){

// const {
//     mutate: markAsAnswered,
//     loading: markAsAnsweredLoading,
//     error: markAsAnsweredError,
// }
// = useMutation(MARK_AS_ANSWERED);
defineProps({})
</script>

<template>
<button >
    Mark as Answered
</button>
</template>