
// Custom command to login via UI
Cypress.Commands.add('login', (email = 'test@t.ca', password = '123456Pw') => {
    cy.visit('/login');
    cy.get('[data-cy="input-email"]').type(email);
    cy.get('[data-cy="input-password"]').type(password);
    cy.get('[data-cy="login-submit"]').click();
    // Wait for redirect to home page
    cy.url().should('not.include', '/login');
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
    cy.get('[data-cy="user-menu"]').click();
    cy.get('[data-cy="logout-btn"]').click();
    cy.url().should('include', '/login');
});

// Custom command to check if element exists
Cypress.Commands.add('elementExists', (selector) => {
    cy.get('body').then($body => {
        return $body.find(selector).length > 0;
    });
});

// Custom command to wait for API
Cypress.Commands.add('waitForApi', () => {
    cy.wait(1000); // Simple wait for API response
});

// Disable uncaught exception handling for React errors
Cypress.on('uncaught:exception', (err, runnable) => {
    // Returning false prevents Cypress from failing the test
    return false;
});