import { DISCUSSION_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("User Switching Authentication", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  beforeEach(() => {
    // Clear all auth state before each test to prevent interference
    cy.clearAllAuthState();
  });

  it("should successfully switch between two different users", () => {
    // Set up GraphQL request interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Test 1: Login as Admin User (User 1)
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify we're authenticated as admin user
    cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
    
    // Test 2: Switch to User 2
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");
    
    cy.switchToUser({
      username: username2,
      password: password2,
      displayName: 'testuser2'
    });
    
    // Verify we're now authenticated as user 2 with a different token
    cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
    
    // Test 3: Switch back to Admin User
    cy.switchToUser({
      username: Cypress.env("auth0_username"),
      password: Cypress.env("auth0_password"),
      displayName: 'cluse'
    });
    
    // Verify we can switch back
    cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
    
    cy.log('✅ User switching test completed successfully');
  });

  it("should maintain separate authentication states", () => {
    // Set up GraphQL request interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    const username1 = Cypress.env("auth0_username");
    const password1 = Cypress.env("auth0_password");
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");

    // Login as User 1 and capture token
    cy.visit(DISCUSSION_LIST);
    cy.switchToUser({
      username: username1,
      password: password1,
      displayName: 'cluse'
    });
    
    let token1: string;
    cy.window().its('localStorage').invoke('getItem', 'token').should('exist').then((token) => {
      token1 = token as string;
      console.log('User 1 token captured:', token1.substring(0, 20) + '...');
    });

    // Switch to User 2 and capture token
    cy.switchToUser({
      username: username2,
      password: password2,
      displayName: 'testuser2'
    });
    
    cy.window().its('localStorage').invoke('getItem', 'token').should('exist').then((token2) => {
      console.log('User 2 token captured:', (token2 as string).substring(0, 20) + '...');
      
      // Verify the tokens are different
      expect(token2).to.not.equal(token1);
      cy.log('✅ Tokens are different - auth states are separate');
    });
  });
});