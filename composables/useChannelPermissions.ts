/**
 * Composable for checking user permissions in a channel
 *
 * This composable encapsulates all the logic for determining what permissions
 * a user has in a specific channel, including:
 * - Fetching user's assigned roles (ChannelRole and ModChannelRole)
 * - Fetching default roles (from channel or server config)
 * - Checking suspension status
 * - Computing final permissions using the permission utility
 */

import { computed, type Ref, type ComputedRef } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import {
  USER_IS_MOD_OR_OWNER_IN_CHANNEL,
  GET_USER_ROLES_IN_CHANNEL,
} from '@/graphQLData/user/queries';
import { getAllPermissions } from '@/utils/permissionUtils';
import { usernameVar, modProfileNameVar } from '@/cache';
import { config } from '@/config';
import type { Suspension } from '@/__generated__/graphql';

type UseChannelPermissionsParams = {
  channelId: Ref<string> | ComputedRef<string>;
};

export const useChannelPermissions = (params: UseChannelPermissionsParams) => {
  const { channelId } = params;

  // Query server config to get default roles
  const { result: getServerResult, loading: serverConfigLoading } = useQuery(
    GET_SERVER_CONFIG,
    {
      serverName: config.serverName,
    },
    {
      fetchPolicy: 'cache-first',
    }
  );

  // Query channel to get channel-specific default roles
  const {
    result: channelResult,
    loading: channelLoading,
    error: channelError,
  } = useQuery(
    GET_CHANNEL,
    { uniqueName: channelId },
    {
      enabled: computed(() => !!channelId.value),
      fetchPolicy: 'cache-first',
    }
  );

  const channel = computed(() => channelResult.value?.channels[0]);

  // Get default user role (channel or server fallback)
  const defaultChannelRole = computed(() => {
    if (channel.value?.DefaultChannelRole) {
      return channel.value.DefaultChannelRole;
    }
    if (getServerResult.value?.serverConfigs[0]?.DefaultServerRole) {
      return getServerResult.value.serverConfigs[0].DefaultServerRole;
    }
    return null;
  });

  // Get default mod role (channel or server fallback)
  const defaultModRole = computed(() => {
    if (channel.value?.DefaultModRole) {
      return channel.value.DefaultModRole;
    }
    if (getServerResult.value?.serverConfigs[0]?.DefaultModRole) {
      return getServerResult.value.serverConfigs[0].DefaultModRole;
    }
    return null;
  });

  // Query user's assigned roles and suspensions
  const {
    result: getUserRolesResult,
    loading: userRolesLoading,
    error: userRolesError,
  } = useQuery(
    GET_USER_ROLES_IN_CHANNEL,
    {
      username: usernameVar,
      channelUniqueName: channelId,
    },
    {
      enabled: computed(() => !!usernameVar.value && !!channelId.value),
      fetchPolicy: 'cache-first',
    }
  );

  // Get user's assigned channel role
  const assignedChannelRole = computed(() => {
    const roles = getUserRolesResult.value?.users?.[0]?.ChannelRoles;
    return roles && roles.length > 0 ? roles[0] : null;
  });

  // Get user's assigned mod channel role
  const assignedModChannelRole = computed(() => {
    const roles = getUserRolesResult.value?.users?.[0]?.ModChannelRoles;
    return roles && roles.length > 0 ? roles[0] : null;
  });

  // Check if user is suspended as a user
  const isSuspendedAsUser = computed(() => {
    const suspensions = getUserRolesResult.value?.users?.[0]?.Suspensions || [];
    return suspensions.some((s: Suspension) => s.username === usernameVar.value);
  });

  // Check if user is suspended as a mod
  const isSuspendedAsMod = computed(() => {
    const suspensions = getUserRolesResult.value?.users?.[0]?.Suspensions || [];
    return suspensions.some((s: Suspension) => s.modProfileName === modProfileNameVar.value);
  });

  // Query for permission data (needed for isChannelOwner and isElevatedMod metadata)
  const {
    result: getPermissionResult,
    loading: permissionDataLoading,
    error: permissionDataError,
  } = useQuery(
    USER_IS_MOD_OR_OWNER_IN_CHANNEL,
    {
      modDisplayName: modProfileNameVar,
      username: usernameVar,
      channelUniqueName: channelId,
    },
    {
      enabled: computed(() => !!usernameVar.value && !!channelId.value),
      fetchPolicy: 'cache-first',
    }
  );

  // Get permission data from the query result
  const permissionData = computed(() => {
    if (getPermissionResult.value?.channels?.[0]) {
      return getPermissionResult.value.channels[0];
    }
    return null;
  });

  // Get all permissions for the current user
  const userPermissions = computed(() => {
    return getAllPermissions({
      permissionData: permissionData.value,
      username: usernameVar.value,
      modProfileName: modProfileNameVar.value,
      isSuspendedAsUser: isSuspendedAsUser.value,
      isSuspendedAsMod: isSuspendedAsMod.value,
      userRoles: {
        assignedChannelRole: assignedChannelRole.value,
        defaultChannelRole: defaultChannelRole.value,
      },
      modRoles: {
        assignedModChannelRole: assignedModChannelRole.value,
        defaultModRole: defaultModRole.value,
      },
    });
  });

  // Aggregate loading states
  const loading = computed(
    () =>
      serverConfigLoading.value ||
      channelLoading.value ||
      userRolesLoading.value ||
      permissionDataLoading.value
  );

  // Aggregate error states
  const error = computed(
    () => channelError.value || userRolesError.value || permissionDataError.value
  );

  return {
    userPermissions,
    loading,
    error,
    // Also expose channel data in case components need it
    channel,
  };
};
