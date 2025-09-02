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
  mutation RefreshPlugins {
    refreshPlugins {
      id
      name
      Versions {
        version
      }
    }
  }
`;

export const ALLOW_PLUGIN = gql`
  mutation AllowPlugin($pluginId: ID!, $serverName: String!) {
    updateServerConfigs(
      where: { serverName: $serverName }
      connect: {
        AllowedPlugins: {
          where: { node: { id: $pluginId } }
        }
      }
    ) {
      serverConfigs {
        serverName
        AllowedPlugins {
          id
          name
        }
      }
    }
  }
`;

export const DISALLOW_PLUGIN = gql`
  mutation DisallowPlugin($pluginId: ID!, $serverName: String!) {
    updateServerConfigs(
      where: { serverName: $serverName }
      disconnect: {
        AllowedPlugins: {
          where: { node: { id: $pluginId } }
        }
      }
    ) {
      serverConfigs {
        serverName
        AllowedPlugins {
          id
          name
        }
      }
    }
  }
`;

export const INSTALL_PLUGIN = gql`
  mutation InstallPlugin($pluginVersionId: ID!, $serverName: String!) {
    updateServerConfigs(
      where: { serverName: $serverName }
      connect: {
        InstalledVersions: {
          where: { node: { id: $pluginVersionId } }
        }
      }
    ) {
      serverConfigs {
        serverName
        InstalledVersions {
          id
          version
          repoUrl
          entryPath
          Plugin {
            id
            name
          }
        }
      }
    }
  }
`;

export const UNINSTALL_PLUGIN = gql`
  mutation UninstallPlugin($pluginVersionId: ID!, $serverName: String!) {
    updateServerConfigs(
      where: { serverName: $serverName }
      disconnect: {
        InstalledVersions: {
          where: { node: { id: $pluginVersionId } }
        }
      }
    ) {
      serverConfigs {
        serverName
        InstalledVersions {
          id
          version
          repoUrl
          entryPath
          Plugin {
            id
            name
          }
        }
      }
    }
  }
`;

export const INSTALL_PLUGIN_VERSION = gql`
  mutation InstallPluginVersion($pluginId: String!, $version: String!) {
    installPluginVersion(pluginId: $pluginId, version: $version) {
      plugin {
        id
        name
      }
      version
      scope
      enabled
      settingsJson
    }
  }
`;

export const ENABLE_SERVER_PLUGIN = gql`
  mutation EnableServerPlugin(
    $pluginId: String!
    $version: String!
    $enabled: Boolean!
    $settingsJson: JSON
  ) {
    enableServerPlugin(
      pluginId: $pluginId
      version: $version
      enabled: $enabled
      settingsJson: $settingsJson
    ) {
      plugin {
        id
        name
      }
      version
      scope
      enabled
      settingsJson
    }
  }
`;

export const SET_SERVER_PLUGIN_SECRET = gql`
  mutation SetServerPluginSecret(
    $pluginId: String!
    $key: String!
    $value: String!
  ) {
    setServerPluginSecret(
      pluginId: $pluginId
      key: $key
      value: $value
    )
  }
`;

export const VALIDATE_SERVER_PLUGIN_SECRET = gql`
  mutation ValidateServerPluginSecret($pluginId: String!, $key: String!) {
    validateServerPluginSecret(pluginId: $pluginId, key: $key) {
      isValid
      error
    }
  }
`;
