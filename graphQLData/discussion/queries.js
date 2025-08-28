import { gql } from '@apollo/client/core';

export const AUTHOR_FIELDS = gql`
  fragment AuthorFields on User {
    username
    displayName
    profilePicURL
    createdAt
    discussionKarma
    commentKarma
    ... on User {
      ServerRoles {
        showAdminTag
      }
    }
  }
`;

// For channel list view
export const GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA = gql`
  query getDiscussionsInChannel(
    $channelUniqueName: String!
    $searchInput: String!
    $selectedTags: [String!]
    $showArchived: Boolean!
    $options: DiscussionListOptions
    $hasDownload: Boolean
    $labelFilters: [LabelFilterInput!]
  ) {
    getDiscussionsInChannel(
      channelUniqueName: $channelUniqueName
      options: $options
      selectedTags: $selectedTags
      searchInput: $searchInput
      showArchived: $showArchived
      hasDownload: $hasDownload
      labelFilters: $labelFilters
    ) {
      aggregateDiscussionChannelsCount
      discussionChannels {
        id
        discussionId
        channelUniqueName
        CommentsAggregate {
          count
        }
        weightedVotesCount
        createdAt
        Channel {
          uniqueName
        }
        UpvotedByUsers {
          username
        }
        UpvotedByUsersAggregate {
          count
        }
        locked
        archived
        answered
        Discussion {
          id
          title
          body
          createdAt
          updatedAt
          hasSensitiveContent
          Author {
            ... on User {
              displayName
              createdAt
              discussionKarma
              commentKarma
              username
              profilePicURL
              ServerRoles {
                showAdminTag
              }
            }
            ChannelRoles(where: { channelUniqueName: $channelUniqueName }) {
              showModTag
            }
          }
          Album {
            id
            imageOrder
            Images {
              id
              url
              alt
              caption
              Uploader {
                username
                displayName
              }
            }
          }
          Tags {
            text
          }
        }
      }
    }
  }
`;

// For site wide list view
export const GET_SITE_WIDE_DISCUSSION_LIST = gql`
  query getSiteWideDiscussionList(
    $searchInput: String!
    $selectedChannels: [String!]
    $selectedTags: [String!]
    $showArchived: Boolean!
    $options: DiscussionListOptions
    $hasDownload: Boolean
  ) {
    getSiteWideDiscussionList(
      searchInput: $searchInput
      selectedChannels: $selectedChannels
      selectedTags: $selectedTags
      showArchived: $showArchived
      options: $options
      hasDownload: $hasDownload
    ) {
      aggregateDiscussionCount
      discussions {
        id
        title
        body
        createdAt
        updatedAt
        hasSensitiveContent
        Author {
          ...AuthorFields
        }
        DiscussionChannels {
          id
          createdAt
          channelUniqueName
          discussionId
          weightedVotesCount
          archived
          answered
          locked
          UpvotedByUsers {
            username
          }
          CommentsAggregate {
            count
          }
        }
        Album {
          id
          imageOrder
          Images {
            id
            url
            alt
            caption
            Uploader {
              username
              displayName
            }
          }
        }
        Tags {
          text
        }
      }
    }
  }
  ${AUTHOR_FIELDS}
`;

export const IS_DISCUSSION_ANSWERED = gql`
  query isDiscussionAnswered($channelUniqueName: String!, $discussionId: ID!) {
    discussionChannels(
      where: {
        channelUniqueName: $channelUniqueName
        discussionId: $discussionId
      }
    ) {
      id
      discussionId
      channelUniqueName
      weightedVotesCount
      archived
      answered
      locked
      Channel {
        uniqueName
      }
    }
  }
`;

export const GET_DISCUSSION = gql`
  ${AUTHOR_FIELDS}
  query getDiscussion(
    $id: ID!
    $loggedInModName: String
    $channelUniqueName: String!
  ) {
    discussions(where: { id: $id }) {
      id
      title
      body
      createdAt
      updatedAt
      hasDownload
      hasSensitiveContent
      Author {
        ...AuthorFields
        ChannelRoles(where: { channelUniqueName: $channelUniqueName }) {
          showModTag
        }
      }
      Album {
        id
        imageOrder
        Images {
          id
          url
          alt
          caption
          copyright
          Uploader {
            username
            displayName
          }
        }
      }
      DiscussionChannels {
        id
        discussionId
        channelUniqueName
        weightedVotesCount
        archived
        answered
        locked
        UpvotedByUsers {
          username
        }
        Channel {
          uniqueName
          channelIconURL
          displayName
        }
        Discussion {
          id
        }
        CommentsAggregate(where: { isFeedbackComment: false }) {
          count
        }
        Answers {
          id
          text
          createdAt
          CommentAuthor {
            ... on User {
              username
              displayName
            }
            ... on ModerationProfile {
              displayName
            }
          }
        }
        LabelOptions {
          id
          value
          displayName
          order
          group {
            id
            key
            displayName
          }
        }
      }
      Tags {
        text
      }
      DownloadableFiles {
        id
        fileName
        url
        kind
        size
        priceModel
        priceCents
        priceCurrency
        license {
          id
          name
        }
      }
      FeedbackCommentsAggregate {
        count
      }
      FeedbackComments(
        where: {
          CommentAuthorConnection: {
            ModerationProfile: { node: { displayName: $loggedInModName } }
          }
        }
      ) {
        id
      }
      PastTitleVersions(options: { sort: [{ createdAt: DESC }] }) {
        id
        Author {
          username
        }
        body
        createdAt
      }
      PastBodyVersions(options: { sort: [{ createdAt: DESC }] }) {
        id
        Author {
          username
        }
        body
        createdAt
      }
    }
  }
`;

export const GET_DISCUSSION_FEEDBACK = gql`
  query getDiscussionFeedback(
    $id: ID!
    $limit: Int
    $offset: Int
    $loggedInModName: String!
  ) {
    discussions(where: { id: $id }) {
      id
      title
      body
      Author {
        username
      }
      FeedbackCommentsAggregate {
        count
      }
      FeedbackComments(options: { limit: $limit, offset: $offset }) {
        id
        text
        archived
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on ModerationProfile {
            createdAt
            displayName
          }
          ... on User {
            username
            createdAt
          }
        }
        createdAt
        FeedbackCommentsAggregate(
          where: {
            CommentAuthorConnection: {
              ModerationProfile: { node: { displayName: $loggedInModName } }
            }
          }
        ) {
          count
        }
        FeedbackComments(
          where: {
            CommentAuthorConnection: {
              ModerationProfile: { node: { displayName: $loggedInModName } }
            }
          }
        ) {
          id
        }
        GivesFeedbackOnDiscussion {
          id
        }
      }
    }
  }
`;

export const GET_SPECIFIC_DISCUSSION_FEEDBACK = gql`
  query getSpecificDiscussionFeedback($discussionId: ID, $modName: String) {
    comments(
      where: {
        GivesFeedbackOnDiscussion: { id: $discussionId }
        CommentAuthorConnection: {
          ModerationProfile: { node: { displayName: $modName } }
        }
      }
    ) {
      id
      text
      createdAt
      archived
      Channel {
        uniqueName
      }
      CommentAuthor(where: { ModerationProfile: { displayName: $modName } }) {
        ... on ModerationProfile {
          displayName
        }
        ... on User {
          username
        }
      }
    }
  }
`;

// # Retrieve everything needed to render the sidebar
// query GetChannelFilters($name: String!) {
//   channel(where: { uniqueName: $name }) {
//     filterGroups(orderBy: order_ASC) {
//       id
//       key
//       displayName
//       mode
//       order
//       options(orderBy: order_ASC) {
//         id
//         value
//         displayName
//         order
//       }
//     }
//   }
// }
