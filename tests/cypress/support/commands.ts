import loginWithButtonClick from './commandFunctions/loginWithButtonClick';
import dropDataForCypressTests from './commandFunctions/dropDataForCypressTests';
import seedDataForCypressTests from './commandFunctions/seedDataForCypressTests';

const AUTH_TOKEN_NAME = 'token'; // This should match what the app expects
const AUTH_TOKEN_CACHE_KEY = 'auth_token_cache';

Cypress.Commands.add('loginWithCreateEventButton', loginWithButtonClick);

Cypress.Commands.add('loginAsAdmin', () => {
  const cachedToken = localStorage.getItem(AUTH_TOKEN_CACHE_KEY);
  const cachedTokenData = cachedToken ? JSON.parse(cachedToken) : null;

  if (cachedTokenData && cachedTokenData.expiresAt > Date.now()) {
    // If possible, use cached token to avoid rate limiting problems with the Auth0 API
    cy.window().then((window) => {
      window.localStorage.setItem(AUTH_TOKEN_NAME, cachedTokenData.accessToken);
    });
    return;
  }

  const options = {
    method: 'POST',
    url: `https://${Cypress.env('auth0Domain')}/oauth/token`,
    body: {
      grant_type: 'password',
      username: Cypress.env('email'),
      password: Cypress.env('password'),
      audience: Cypress.env('auth0Audience'),
      scope: 'openid profile email',
      client_id: Cypress.env('auth0ClientId'),
      client_secret: Cypress.env('auth0ClientSecret'),
    },
  };

  cy.request(options).then((response) => {
    const accessToken = response.body.access_token;
    const expiresIn = response.body.expires_in; // Token expiry in seconds

    // Cache the token with its expiry time
    const tokenData = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000, // Convert to milliseconds
    };
    localStorage.setItem(AUTH_TOKEN_CACHE_KEY, JSON.stringify(tokenData));

    // Set the token in localStorage for the app
    cy.window().then((window) => {
      window.localStorage.setItem(AUTH_TOKEN_NAME, accessToken);
    });
  });
});

const baseUrl = Cypress.env('baseUrl') || 'http://localhost:3000';
const sessionSeedUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

// Session-cached version of programmatic login for better performance
Cypress.Commands.add('loginProgrammatically', () => {
  cy.session('admin-user', () => {
    cy.visit(sessionSeedUrl);
    cy.loginAsAdmin();
    cy.window()
      .its('localStorage')
      .invoke('getItem', AUTH_TOKEN_NAME)
      .should((token) => {
        expect(
          token,
          'auth token should exist after programmatic login'
        ).to.be.a('string');
      });
  });
});

type AuthStateOptions = {
  username?: string;
  authenticated?: boolean;
  profilePicURL?: string;
  modProfileName?: string;
  waitForSelector?: string;
};

const syncAuthState = (options: AuthStateOptions = {}) => {
  const {
    username = 'cluse',
    authenticated = true,
    profilePicURL,
    modProfileName,
    waitForSelector = '[data-auth-state="authenticated"]',
  } = options;

  cy.document({ timeout: 10000 })
    .its('readyState')
    .should('eq', 'complete');

  cy.window({ timeout: 10000 })
    .its('localStorage')
    .invoke('getItem', AUTH_TOKEN_NAME)
    .should((token) => {
      expect(
        token,
        'auth token should be present before syncing UI state'
      ).to.be.a('string');
    });

  cy.window({ timeout: 10000 })
    .its('__SET_AUTH_STATE_DIRECT__')
    .should('be.a', 'function');

  cy.window().then((win) => {
    const setter = (win as any).__SET_AUTH_STATE_DIRECT__;
    setter?.({
      username,
      authenticated,
      profilePicURL,
      modProfileName,
    });
  });

  if (waitForSelector) {
    cy.get(waitForSelector, { timeout: 5000 }).should('be.visible');
  }
};

Cypress.Commands.add('syncAuthState', (options: AuthStateOptions = {}) => {
  syncAuthState(options);
});

Cypress.Commands.add('authenticateOnCurrentPage', (options: AuthStateOptions = {}) => {
  syncAuthState(options);
});

Cypress.Commands.add('authenticatedGraphQL', (query, variables = {}) => {
  // Ensure the token is up-to-date before making the GraphQL request
  const getToken = () => {
    return cy.window().then((window) => {
      const cachedToken = window.localStorage.getItem(AUTH_TOKEN_CACHE_KEY);
      const cachedTokenData = cachedToken ? JSON.parse(cachedToken) : null;
      if (cachedTokenData && cachedTokenData.expiresAt > Date.now()) {
        // Return the valid cached token
        return cachedTokenData.accessToken;
      }

      // If no valid cached token, refresh it using the login command
      return cy.loginAsAdmin().then(() => {
        const newToken = window.localStorage.getItem(AUTH_TOKEN_CACHE_KEY);
        const newTokenData = newToken ? JSON.parse(newToken) : null;
        return newTokenData.accessToken;
      });
    });
  };

  // Retrieve the token and use it in the GraphQL request
  return getToken().then((token) => {
    return cy
      .request({
        method: 'POST',
        url: Cypress.env('graphqlUrl'),
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          query,
          variables,
        },
        failOnStatusCode: false,
      })
      .then((response) => {
        // Log GraphQL errors if present
        if (response.body.errors) {
          console.error('GraphQL Error Response:', {
            errors: response.body.errors,
            status: response.status,
            statusText: response.statusText,
          });
        }

        // Return the full response for backward compatibility
        return response;
      });
  });
});

Cypress.Commands.add('safetyCheck', () => {
  return cy
    .authenticatedGraphQL(
      `
    query safetyCheck {
        safetyCheck {
            environment {
            currentDatabase
            isTestEnvironment
            }
        }
    }`
    )
    .then((response) => {
      const env = response?.body?.data?.safetyCheck?.environment;
      throw new Error(
        `🚨 SAFETY CHECK FAILED: Not in test environment! ` +
          `Current database: ${env.currentDatabase}`
      );
    });
});

// ADDING SEED DATA
Cypress.Commands.add('seedDataForCypressTests', seedDataForCypressTests);

// DELETING SEED DATA
Cypress.Commands.add('dropDataForCypressTests', dropDataForCypressTests);

let clipboardText = '';
Cypress.Commands.add('getClipboardText', () => {
  // Return a Cypress chainable by wrapping the value
  return cy.wrap(clipboardText);
});

Cypress.Commands.add('writeClipboardText', () => {
  cy.window().then((win) => {
    win.navigator.clipboard.writeText = (text) => {
      clipboardText = text;
      return Promise.resolve();
    };
  });
});

// FIXED: Clear all auth state completely including Auth0's internal cache
Cypress.Commands.add('clearAllAuthState', () => {
  // Clear browser localStorage - including Auth0's cache
  cy.window().then((window) => {
    // Clear our app's auth tokens
    window.localStorage.removeItem(AUTH_TOKEN_NAME);
    window.localStorage.removeItem(AUTH_TOKEN_CACHE_KEY);

    // Clear ALL Auth0-related localStorage entries
    // Auth0 stores tokens with keys like: @@auth0spajs@@::CLIENT_ID::AUDIENCE::scope
    Object.keys(window.localStorage).forEach((key) => {
      if (
        key.includes('@@auth0spajs@@') ||
        key.includes('auth0') ||
        key.startsWith('auth0.') ||
        key.startsWith(AUTH_TOKEN_CACHE_KEY)
      ) {
        console.log('Clearing Auth0 cache key:', key);
        window.localStorage.removeItem(key);
      }
    });

    // Clear session storage too (Auth0 might use this)
    Object.keys(window.sessionStorage).forEach((key) => {
      if (
        key.includes('@@auth0spajs@@') ||
        key.includes('auth0') ||
        key.startsWith('auth0.')
      ) {
        console.log('Clearing Auth0 session key:', key);
        window.sessionStorage.removeItem(key);
      }
    });

    // Clear the rest of session storage
    window.sessionStorage.clear();
  });

  // Clear Cypress localStorage cache
  localStorage.removeItem(AUTH_TOKEN_CACHE_KEY);

  // Clear ALL Cypress localStorage that might be Auth0 related
  Object.keys(localStorage).forEach((key) => {
    if (
      key.includes('@@auth0spajs@@') ||
      key.includes('auth0') ||
      key.startsWith('auth0.') ||
      key.startsWith(AUTH_TOKEN_CACHE_KEY)
    ) {
      localStorage.removeItem(key);
    }
  });

  // Reset Vue reactive auth state
  cy.window().then((win) => {
    const testWin = win as any;
    if (testWin.__SET_AUTH_STATE_DIRECT__) {
      testWin.__SET_AUTH_STATE_DIRECT__({
        username: '',
        authenticated: false,
      });
    }
  });
});

// FIXED: Login as different user with proper cache clearing
Cypress.Commands.add(
  'loginAsUser',
  (userCredentials: { username: string; password: string }) => {
    // Log the credentials being used for debugging
    console.log(`Attempting login for user: ${userCredentials.username}`);
    console.log(
      `Password provided: ${userCredentials.password ? '[REDACTED]' : 'UNDEFINED/EMPTY'}`
    );

    // Check if credentials are actually provided
    if (!userCredentials.username || !userCredentials.password) {
      throw new Error(
        `Invalid credentials provided: username=${userCredentials.username}, password=${userCredentials.password ? '[PROVIDED]' : 'MISSING'}`
      );
    }

    // ALWAYS make a fresh request - NO CACHING for different users
    // This ensures each user gets their own unique token
    const options = {
      method: 'POST',
      url: `https://${Cypress.env('auth0Domain')}/oauth/token`,
      body: {
        grant_type: 'password',
        username: userCredentials.username,
        password: userCredentials.password,
        audience: Cypress.env('auth0Audience'),
        scope: 'openid profile email',
        client_id: Cypress.env('auth0ClientId'),
        client_secret: Cypress.env('auth0ClientSecret'),
      },
    };

    cy.request(options).then((response) => {
      const accessToken = response.body.access_token;

      console.log(
        `Fresh token for ${userCredentials.username}:`,
        accessToken.substring(0, 20) + '...'
      );

      // Set token directly in browser localStorage - no caching
      cy.window().then((window) => {
        window.localStorage.setItem(AUTH_TOKEN_NAME, accessToken);
      });
    });
  }
);

Cypress.Commands.add(
  'authenticateAsUserOnCurrentPage',
  (userCredentials: {
    username: string;
    password: string;
    displayName?: string;
  }) => {
    // First, completely clear all previous auth state
    cy.clearAllAuthState();

    // Wait a moment for the clear to take effect
    cy.wait(500);

    // Set the auth token programmatically for the specified user
    cy.loginAsUser(userCredentials);

    cy.syncAuthState({
      username: userCredentials.displayName || userCredentials.username,
      authenticated: true,
    });
  }
);
