import { describe, it, expect } from 'vitest';
import { checkPermission, getAllPermissions } from '@/utils/permissionUtils';
import type {
  CheckPermissionParams,
  GetAllPermissionsParams,
} from '@/utils/permissionUtils';

describe('permissionUtils', () => {
  describe('checkPermission', () => {
    // Sample test data for user roles
    const defaultChannelRole = {
      canCreateComment: true,
      canCreateDiscussion: true,
      canCreateEvent: true,
      canUpdateChannel: false,
      canUploadFile: true,
      canUpvoteComment: true,
      canUpvoteDiscussion: true,
    };

    const adminChannelRole = {
      canCreateComment: true,
      canCreateDiscussion: true,
      canCreateEvent: true,
      canUpdateChannel: true,
      canUploadFile: true,
      canUpvoteComment: true,
      canUpvoteDiscussion: true,
    };

    // Sample test data for mod roles
    const defaultModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: false,
      canHideDiscussion: false,
      canHideEvent: false,
      canSuspendUser: false,
      canOpenSupportTickets: true,
      canCloseSupportTickets: false,
      canLockChannel: false,
    };

    const elevatedModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: true,
      canHideDiscussion: true,
      canHideEvent: true,
      canSuspendUser: true,
      canOpenSupportTickets: true,
      canCloseSupportTickets: true,
      canLockChannel: true,
    };

    it('should fall back to default role if no assigned role exists', () => {
      const params: CheckPermissionParams = {
        permissionData: null,
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole,
        },
        action: 'canReport',
      };

      expect(checkPermission(params)).toBe(true);
    });

    it('should return false if both roles are null', () => {
      const params: CheckPermissionParams = {
        permissionData: {
          Admins: [{ username: 'admin1' }],
          Moderators: [{ displayName: 'mod2' }],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole: null,
        },
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole: null,
        },
        action: 'canReport',
      };

      expect(checkPermission(params)).toBe(false);
    });

    it('should return false if user is suspended (user permissions)', () => {
      const params: CheckPermissionParams = {
        permissionData: {
          Admins: [{ username: 'admin1' }],
          Moderators: [{ displayName: 'mod2' }],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: true,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole,
        },
        action: 'canCreateDiscussion',
      };

      expect(checkPermission(params)).toBe(false);
    });

    it('should return false if mod is suspended (mod permissions)', () => {
      const params: CheckPermissionParams = {
        permissionData: {
          Admins: [{ username: 'admin1' }],
          Moderators: [{ displayName: 'mod2' }],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: true,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole,
        },
        action: 'canReport',
      };

      expect(checkPermission(params)).toBe(false);
    });

    it('should use assigned mod role over default mod role', () => {
      const permissionData = {
        Admins: [{ username: 'admin1' }],
        Moderators: [{ displayName: 'mod1' }],
      };

      // Permission that elevated mods have but standard mods don't
      expect(
        checkPermission({
          permissionData,
          username: 'user1',
          modProfileName: 'mod1',
          isSuspendedAsUser: false,
          isSuspendedAsMod: false,
          userRoles: {
            assignedChannelRole: null,
            defaultChannelRole,
          },
          modRoles: {
            assignedModChannelRole: elevatedModRole,
            defaultModRole,
          },
          action: 'canHideComment',
        })
      ).toBe(true);
    });

    it('should use default mod role if no assigned role', () => {
      const permissionData = {
        Admins: [{ username: 'admin1' }],
        Moderators: [{ displayName: 'mod2' }],
      };

      // Permission that standard mods have
      expect(
        checkPermission({
          permissionData,
          username: 'user1',
          modProfileName: 'mod1',
          isSuspendedAsUser: false,
          isSuspendedAsMod: false,
          userRoles: {
            assignedChannelRole: null,
            defaultChannelRole,
          },
          modRoles: {
            assignedModChannelRole: null,
            defaultModRole,
          },
          action: 'canReport',
        })
      ).toBe(true);

      // Permission that standard mods don't have
      expect(
        checkPermission({
          permissionData,
          username: 'user1',
          modProfileName: 'mod1',
          isSuspendedAsUser: false,
          isSuspendedAsMod: false,
          userRoles: {
            assignedChannelRole: null,
            defaultChannelRole,
          },
          modRoles: {
            assignedModChannelRole: null,
            defaultModRole,
          },
          action: 'canHideComment',
        })
      ).toBe(false);
    });

    it('should handle missing userRoles without throwing', () => {
      const params = {
        permissionData: null,
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: false,
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole,
        },
        action: 'canCreateDiscussion',
      } as unknown as CheckPermissionParams;

      expect(() => checkPermission(params)).not.toThrow();
      expect(checkPermission(params)).toBe(false);
    });

    it('should handle missing modRoles without throwing', () => {
      const params = {
        permissionData: null,
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        action: 'canReport',
      } as unknown as CheckPermissionParams;

      expect(() => checkPermission(params)).not.toThrow();
      expect(checkPermission(params)).toBe(false);
    });

    it('should use assigned user role over default user role', () => {
      const permissionData = {
        Admins: [{ username: 'admin1' }],
        Moderators: [],
      };

      // User with assigned admin role can update channel
      expect(
        checkPermission({
          permissionData,
          username: 'user1',
          modProfileName: 'mod1',
          isSuspendedAsUser: false,
          isSuspendedAsMod: false,
          userRoles: {
            assignedChannelRole: adminChannelRole,
            defaultChannelRole,
          },
          modRoles: {
            assignedModChannelRole: null,
            defaultModRole,
          },
          action: 'canUpdateChannel',
        })
      ).toBe(true);

      // User with default role cannot update channel
      expect(
        checkPermission({
          permissionData,
          username: 'user2',
          modProfileName: 'mod1',
          isSuspendedAsUser: false,
          isSuspendedAsMod: false,
          userRoles: {
            assignedChannelRole: null,
            defaultChannelRole,
          },
          modRoles: {
            assignedModChannelRole: null,
            defaultModRole,
          },
          action: 'canUpdateChannel',
        })
      ).toBe(false);
    });

    it('should default to false if permission is not found in roles', () => {
      const permissionData = {
        Admins: [{ username: 'admin1' }],
        Moderators: [{ displayName: 'mod2' }],
      };

      expect(
        checkPermission({
          permissionData,
          username: 'user1',
          modProfileName: 'mod1',
          isSuspendedAsUser: false,
          isSuspendedAsMod: false,
          userRoles: {
            assignedChannelRole: null,
            defaultChannelRole,
          },
          modRoles: {
            assignedModChannelRole: null,
            defaultModRole,
          },
          action: 'nonExistentPermission',
        })
      ).toBe(false);
    });
  });

  describe('getAllPermissions', () => {
    const defaultChannelRole = {
      canCreateComment: true,
      canCreateDiscussion: true,
      canCreateEvent: true,
      canUpdateChannel: false,
      canUploadFile: true,
      canUpvoteComment: true,
      canUpvoteDiscussion: true,
    };

    const adminChannelRole = {
      canCreateComment: true,
      canCreateDiscussion: true,
      canCreateEvent: true,
      canUpdateChannel: true,
      canUploadFile: true,
      canUpvoteComment: true,
      canUpvoteDiscussion: true,
    };

    const defaultModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: false,
      canHideDiscussion: false,
      canHideEvent: false,
      canSuspendUser: false,
      canOpenSupportTickets: true,
      canCloseSupportTickets: false,
      canLockChannel: false,
    };

    const elevatedModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: true,
      canHideDiscussion: true,
      canHideEvent: true,
      canSuspendUser: true,
      canOpenSupportTickets: true,
      canCloseSupportTickets: true,
      canLockChannel: true,
    };

    it('should return all permissions for a channel owner with assigned role', () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: 'user1' }],
          Moderators: [],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: adminChannelRole,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: elevatedModRole,
          defaultModRole,
        },
      };

      const permissions = getAllPermissions(params);

      // Should have admin channel permissions
      expect(permissions.canUpdateChannel).toBe(true);
      expect(permissions.canCreateDiscussion).toBe(true);
      // Should have elevated mod permissions
      expect(permissions.canReport).toBe(true);
      expect(permissions.canHideComment).toBe(true);
      expect(permissions.canSuspendUser).toBe(true);
      // Metadata
      expect(permissions.isChannelOwner).toBe(true);
      expect(permissions.isElevatedMod).toBe(false);
      expect(permissions.isSuspendedMod).toBe(false);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it('should return all permissions for an elevated mod', () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: 'admin1' }],
          Moderators: [{ displayName: 'mod1' }],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: elevatedModRole,
          defaultModRole,
        },
      };

      const permissions = getAllPermissions(params);

      // Should have user permissions
      expect(permissions.canCreateDiscussion).toBe(true);
      expect(permissions.canUpdateChannel).toBe(false);
      // Should have elevated mod permissions
      expect(permissions.canReport).toBe(true);
      expect(permissions.canHideComment).toBe(true);
      expect(permissions.canHideDiscussion).toBe(true);
      expect(permissions.canSuspendUser).toBe(true);
      // Metadata
      expect(permissions.isChannelOwner).toBe(false);
      expect(permissions.isElevatedMod).toBe(true);
      expect(permissions.isSuspendedMod).toBe(false);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it('should return all permissions for a standard user', () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: 'admin1' }],
          Moderators: [{ displayName: 'mod2' }],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole,
        },
      };

      const permissions = getAllPermissions(params);

      // Should have standard user permissions
      expect(permissions.canCreateDiscussion).toBe(true);
      expect(permissions.canUpdateChannel).toBe(false);
      // Should have standard mod permissions
      expect(permissions.canReport).toBe(true);
      expect(permissions.canGiveFeedback).toBe(true);
      expect(permissions.canHideComment).toBe(false);
      // Metadata
      expect(permissions.isChannelOwner).toBe(false);
      expect(permissions.isElevatedMod).toBe(false);
      expect(permissions.isSuspendedMod).toBe(false);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it('should return all permissions for a suspended mod', () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: 'admin1' }],
          Moderators: [{ displayName: 'mod2' }],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: false,
        isSuspendedAsMod: true,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole,
        },
      };

      const permissions = getAllPermissions(params);

      // Suspended mods have no mod permissions
      expect(permissions.canReport).toBe(false);
      expect(permissions.canHideComment).toBe(false);
      // But still have user permissions
      expect(permissions.canCreateDiscussion).toBe(true);
      // Metadata
      expect(permissions.isChannelOwner).toBe(false);
      expect(permissions.isElevatedMod).toBe(false);
      expect(permissions.isSuspendedMod).toBe(true);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it('should return all permissions for a suspended user', () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: 'admin1' }],
          Moderators: [{ displayName: 'mod2' }],
        },
        username: 'user1',
        modProfileName: 'mod1',
        isSuspendedAsUser: true,
        isSuspendedAsMod: false,
        userRoles: {
          assignedChannelRole: null,
          defaultChannelRole,
        },
        modRoles: {
          assignedModChannelRole: null,
          defaultModRole,
        },
      };

      const permissions = getAllPermissions(params);

      // Suspended users have no user permissions
      expect(permissions.canCreateDiscussion).toBe(false);
      expect(permissions.canUpdateChannel).toBe(false);
      // But still have mod permissions
      expect(permissions.canReport).toBe(true);
      // Metadata
      expect(permissions.isSuspendedUser).toBe(true);
      expect(permissions.isSuspendedMod).toBe(false);
    });
  });
});
