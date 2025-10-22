/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Log in programmatically using Auth0 API
     */
    loginAsAdmin(): Chainable<void>;

    /**
     * Log in programmatically with session caching for better performance
     */
    loginProgrammatically(): Chainable<void>;

    /**
     * Sync the application UI with the current authentication token
     */
    syncAuthState(authState?: {
      username?: string;
      authenticated?: boolean;
      profilePicURL?: string;
      modProfileName?: string;
      waitForSelector?: string;
    }): Chainable<void>;

    /**
     * Convenience helper to sync auth state on the current page
     */
    authenticateOnCurrentPage(authState?: {
      username?: string;
      authenticated?: boolean;
      profilePicURL?: string;
      modProfileName?: string;
      waitForSelector?: string;
    }): Chainable<void>;

    /**
     * Log in using UI button click
     */
    loginWithCreateEventButton(): Chainable<void>;

    /**
     * Make authenticated GraphQL request
     */
    authenticatedGraphQL(query: string, variables?: any): Chainable<any>;

    /**
     * Perform safety check to ensure test environment
     */
    safetyCheck(): Chainable<any>;

    /**
     * Seed test data
     */
    seedDataForCypressTests(): Chainable<void>;

    /**
     * Drop test data
     */
    dropDataForCypressTests(): Chainable<void>;

    /**
     * Get clipboard text
     */
    getClipboardText(): Chainable<string>;

    /**
     * Setup clipboard text writing
     */
    writeClipboardText(): Chainable<void>;
  }
}
