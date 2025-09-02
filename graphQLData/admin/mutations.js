import { gql } from '@apollo/client/core';

export const UPDATE_SERVER_CONFIG = gql`
  mutation updateServerConfig(
    $serverName: String!
    $input: ServerConfigUpdateInput
  ) {
    updateServerConfigs(where: { serverName: $serverName }, update: $input) {
      serverConfigs {
        serverName
        serverDescription
        rules
        enableDownloads
        enableEvents
        allowedFileTypes
        pluginRegistries
      }
    }
  }
`;

export const REFRESH_PLUGINS = gql`
  mutation refreshPlugins {
    refreshPlugins {
      id
      name
    }
  }
`;
