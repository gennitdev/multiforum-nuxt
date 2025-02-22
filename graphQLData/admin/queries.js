import { gql } from "@apollo/client/core";

export const GET_SERVER_CONFIG = gql`
  query getServerConfig($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      serverIconURL
      serverDescription
      DefaultServerRole {
        name
        description
      }
      DefaultModRole {
        name
        description
      }
      DefaultElevatedModRole {
        name
      }
      DefaultSuspendedRole {
        name
        description
      }
      DefaultSuspendedModRole {
        name
        description
      }
      rules
    }
  }
`;

export const GET_SERVER_PERMISSIONS = gql`
  query getServerConfig($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      DefaultModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultElevatedModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultSuspendedModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultServerRole {
        name
        description
        canUpvoteDiscussion
        canUpvoteComment
        canUploadFile
        canGiveFeedback
        canCreateEvent
        canCreateDiscussion
        canCreateComment
        canCreateChannel
      }
      DefaultSuspendedRole {
        name
        description
        canUpvoteDiscussion
        canUpvoteComment
        canUploadFile
        canGiveFeedback
        canCreateEvent
        canCreateDiscussion
        canCreateComment
        canCreateChannel
      }
    }
  }
`;

export const GET_SERVER_RULES = gql`
  query getServerRules {
    serverConfigs {
      serverName
      rules
    }
  }
`;
