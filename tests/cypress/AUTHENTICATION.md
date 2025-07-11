# Cypress Programmatic Authentication Guide

This guide explains how to use the enhanced programmatic authentication in Cypress tests that support multiple users.

## Available Commands

### Basic Authentication

```typescript
// Authenticate as the default admin user
cy.authenticateOnCurrentPage();

// Clear all authentication state (localStorage, sessionStorage, reactive state)
cy.clearAllAuthState();
```

### Multi-User Authentication

```typescript
// Switch to a different user within the same test
cy.switchToUser({
  username: 'user@example.com',
  password: 'password123',
  displayName: 'TestUser' // Optional display name for UI
});

// Full authentication setup (use when visiting a new page)
cy.authenticateAsUserOnCurrentPage({
  username: 'user@example.com',
  password: 'password123',
  displayName: 'TestUser'
});
```

## Example: Testing with Multiple Users

```typescript
describe("Multi-user workflow", () => {
  beforeEach(() => {
    // Always clear auth state before each test
    cy.clearAllAuthState();
  });

  it("User 1 creates content, User 2 interacts with it", () => {
    // Set up network interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // User 1: Create content
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage(); // Default admin user
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // ... User 1 creates content ...
    
    // User 2: Interact with content
    const user2Credentials = {
      username: Cypress.env("auth0_username_2"),
      password: Cypress.env("auth0_password_2"),
      displayName: 'testuser2'
    };
    
    cy.switchToUser(user2Credentials);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // ... User 2 interacts with content ...
  });
});
```

## Environment Variables

Make sure your `cypress.env.json` includes credentials for multiple users:

```json
{
  "auth0_username": "user1@example.com",
  "auth0_password": "password1",
  "auth0_username_2": "user2@example.com",
  "auth0_password_2": "password2"
}
```

## Best Practices

1. **Always clear auth state**: Use `cy.clearAllAuthState()` in `beforeEach()` to prevent test interference
2. **Use switchToUser for quick switches**: Within the same test, use `cy.switchToUser()` for better performance
3. **Wait for GraphQL requests**: Always wait for the initial GraphQL request after authentication
4. **Verify token existence**: Check that tokens are set correctly after authentication
5. **Use network interception**: Set up GraphQL interception to wait for requests properly

## Troubleshooting

### Authentication Not Working
- Check that environment variables are set correctly
- Verify that the test auth composables are loaded (they should be in the default layout)
- Look for console logs starting with 🔧, 🔄, or 🧹 for debugging information

### Timing Issues
- Increase wait times if needed, especially after user switches
- Ensure GraphQL interception is set up before authentication
- Use `cy.wait('@graphqlRequest')` after authentication calls

### State Not Clearing
- The enhanced `clearAllAuthState()` should handle all Auth0 and app state
- If issues persist, check browser localStorage/sessionStorage manually
- Look for any remaining auth-related keys that might need clearing

## Command Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `cy.clearAllAuthState()` | Clear all auth state completely | Before each test, before user switches |
| `cy.authenticateOnCurrentPage()` | Login as default admin user | Single-user tests, first user in multi-user tests |
| `cy.switchToUser(credentials)` | Quick user switch | Within the same test for different users |
| `cy.authenticateAsUserOnCurrentPage(credentials)` | Full auth setup for specific user | When visiting new pages as different users |
| `cy.loginAsUser(credentials)` | Low-level token retrieval | Advanced use cases, custom auth flows |