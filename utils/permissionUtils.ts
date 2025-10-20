/**
 * Permission utility functions for checking user and moderator permissions in forums/channels
 *
 * The application has two separate permission systems:
 * 1. User Permissions - Control what regular users can do (create content, upvote, etc.)
 * 2. Moderator Permissions - Control what moderators can do (archive content, give feedback, etc.)
 *
 * Both systems follow similar patterns but have different roles and permissions.
 */
import type {
  ChannelRole,
  ModChannelRole,
  ModServerRole,
  ServerRole,
} from '@/__generated__/graphql';

// Create a union type of all permission keys from ModChannelRole and ModServerRole
type ModPermissionKey = keyof Pick<
  ModChannelRole & ModServerRole,
  | 'canReport'
  | 'canGiveFeedback'
  | 'canHideComment'
  | 'canHideDiscussion'
  | 'canHideEvent'
  | 'canSuspendUser'
  | 'canOpenSupportTickets'
  | 'canCloseSupportTickets'
  | 'canLockChannel'
>;

// User permission keys
type UserPermissionKey = keyof Pick<
  ChannelRole & ServerRole,
  | 'canCreateComment'
  | 'canCreateDiscussion'
  | 'canCreateEvent'
  | 'canUpdateChannel'
  | 'canUploadFile'
  | 'canUpvoteComment'
  | 'canUpvoteDiscussion'
>;

// Combined permission keys type
type PermissionKey = ModPermissionKey | UserPermissionKey | string;

// Role type used in the utility functions
type Role = {
  [K in PermissionKey]?: boolean;
} & {
  // Additional permissions not directly in the schema types
  canEditWiki?: boolean;
  canAddMods?: boolean;
  canRemoveMods?: boolean;
  canAddOwners?: boolean;
  canRemoveOwners?: boolean;
  canChangeSettings?: boolean;
  [key: string]: boolean | undefined;
};

// Channel data containing role assignments
type PermissionData = {
  Admins?: Array<{ username: string }>;
  Moderators?: Array<{ displayName: string }>;
  uniqueName?: string;
  [key: string]: any;
};

// Parameter types for the exported functions
export type CheckPermissionParams = {
  permissionData: PermissionData | null;
  username: string;
  modProfileName: string;
  isSuspendedAsUser: boolean;
  isSuspendedAsMod: boolean;
  userRoles: {
    assignedChannelRole: Role | null;
    defaultChannelRole: Role | null;
  };
  modRoles: {
    assignedModChannelRole: Role | null;
    defaultModRole: Role | null;
  };
  action: PermissionKey;
};

export type GetAllPermissionsParams = {
  permissionData: PermissionData | null;
  username: string;
  modProfileName: string;
  isSuspendedAsUser: boolean;
  isSuspendedAsMod: boolean;
  userRoles: {
    assignedChannelRole: Role | null;
    defaultChannelRole: Role | null;
  };
  modRoles: {
    assignedModChannelRole: Role | null;
    defaultModRole: Role | null;
  };
};

/**
 * Checks if the user has permission to perform a specific action in a channel
 *
 * Permission checking logic:
 * 1. Determine if action is a user permission or mod permission
 * 2. Check suspension status (denies permissions for that role type)
 * 3. Use assigned role if exists, otherwise fall back to default role
 *
 * @param params - Object containing all parameters
 * @returns boolean indicating if the user has permission
 */
export const checkPermission = (params: CheckPermissionParams): boolean => {
  const {
    isSuspendedAsUser,
    isSuspendedAsMod,
    userRoles,
    modRoles,
    action,
  } = params;

  // ---------- STEP 1: Determine if this is a user or mod permission ----------
  const userPermissionKeys: UserPermissionKey[] = [
    'canCreateComment',
    'canCreateDiscussion',
    'canCreateEvent',
    'canUpdateChannel',
    'canUploadFile',
    'canUpvoteComment',
    'canUpvoteDiscussion',
  ];

  const isUserPermission = userPermissionKeys.includes(action as UserPermissionKey);

  // ---------- STEP 2: Check user permissions ----------
  if (isUserPermission) {
    // If suspended as user, deny all user permissions
    if (isSuspendedAsUser) {
      return false;
    }

    // Use assigned role if exists, otherwise fall back to default
    const roleToCheck =
      userRoles.assignedChannelRole || userRoles.defaultChannelRole;

    if (roleToCheck && roleToCheck[action] !== undefined) {
      return !!roleToCheck[action];
    }

    // If no role found, deny permission
    return false;
  }

  // ---------- STEP 3: Check mod permissions ----------
  // If suspended as mod, deny all mod permissions
  if (isSuspendedAsMod) {
    return false;
  }

  // Use assigned mod role if exists, otherwise fall back to default
  const modRoleToCheck =
    modRoles.assignedModChannelRole || modRoles.defaultModRole;

  if (modRoleToCheck && modRoleToCheck[action] !== undefined) {
    return !!modRoleToCheck[action];
  }

  // If no role found, deny permission
  return false;
};

/**
 * Gets all permissions for a user in a channel
 *
 * @param params - Object containing all parameters
 * @returns Object with all permissions mapped including role metadata
 */
export const getAllPermissions = (
  params: GetAllPermissionsParams
): Record<string, boolean> => {
  if (!params) {
    return {};
  }
  const {
    permissionData,
    username,
    modProfileName,
    isSuspendedAsUser,
    isSuspendedAsMod,
    userRoles,
    modRoles,
  } = params;

  // Define user permissions
  const userPermissions: UserPermissionKey[] = [
    'canCreateComment',
    'canCreateDiscussion',
    'canCreateEvent',
    'canUpdateChannel',
    'canUploadFile',
    'canUpvoteComment',
    'canUpvoteDiscussion',
  ];

  // Define mod permissions
  const modPermissions: ModPermissionKey[] = [
    'canReport',
    'canGiveFeedback',
    'canHideComment',
    'canHideDiscussion',
    'canHideEvent',
    'canSuspendUser',
    'canOpenSupportTickets',
    'canCloseSupportTickets',
    'canLockChannel',
  ];

  // Additional permissions specific to our application
  const additionalPermissions: string[] = [
    'canEditWiki',
    'canAddMods',
    'canRemoveMods',
    'canAddOwners',
    'canRemoveOwners',
    'canChangeSettings',
  ];

  // Combine all permission types
  const allActions = [
    ...userPermissions,
    ...modPermissions,
    ...additionalPermissions,
  ];

  // Create an object with all permissions
  const permissions: Record<string, boolean> = {};

  allActions.forEach((action) => {
    permissions[action] = checkPermission({
      permissionData,
      username,
      modProfileName,
      isSuspendedAsUser,
      isSuspendedAsMod,
      userRoles,
      modRoles,
      action,
    });
  });

  // Add role metadata (useful for UI logic)
  permissions.isChannelOwner =
    permissionData?.Admins?.some((admin) => admin.username === username) ||
    false;

  permissions.isElevatedMod =
    permissionData?.Moderators?.some(
      (mod) => mod.displayName === modProfileName
    ) || false;

  permissions.isSuspendedUser = isSuspendedAsUser;
  permissions.isSuspendedMod = isSuspendedAsMod;

  return permissions;
};
