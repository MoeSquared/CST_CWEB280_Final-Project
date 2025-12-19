describe('Login Functionality', () => {
    beforeEach(() => {
        cy.visit('/login');
    });


    it('should login successfully with correct credentials', () => {
        // Enter valid credentials (test user from database)
        cy.get('[data-cy="input-email"]').type('test@t.ca');
        cy.get('[data-cy="input-password"]').type('123456Pw');

        // Submit the form
        cy.get('[data-cy="login-submit"]').click();

        // Verify successful login - redirected to home page
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        // Verify navbar is visible (indicates authenticated state)
        cy.get('[data-cy="navbar"]').should('be.visible');

        // Verify user menu shows correct user
        cy.get('[data-cy="user-menu"]').should('be.visible');

        // Verify token is stored in localStorage
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.not.be.null;
        });
    });


    it('should show error with wrong password', () => {
        // Enter email with incorrect password
        cy.get('[data-cy="input-email"]').type('test@t.ca');
        cy.get('[data-cy="input-password"]').type('wrongpassword123');

        // Submit the form
        cy.get('[data-cy="login-submit"]').click();

        // Wait for API response
        cy.wait(1000);

        // Verify still on login page (not redirected)
        cy.url().should('include', '/login');

        // Verify no token stored (login failed)
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.be.null;
        });
    });


    it('should show error with non-existent email', () => {
        // Enter non-existent email
        cy.get('[data-cy="input-email"]').type('nonexistent@email.com');
        cy.get('[data-cy="input-password"]').type('123456Pw');

        // Submit the form
        cy.get('[data-cy="login-submit"]').click();

        // Wait for API response
        cy.wait(1000);

        // Verify still on login page (not redirected)
        cy.url().should('include', '/login');

        // Verify no token stored (login failed)
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.be.null;
        });
    });

    it('should show validation errors when form is empty', () => {
        // Click submit without filling any fields
        cy.get('[data-cy="login-submit"]').click();

        // Verify validation errors are shown
        cy.get('[data-cy="error-email"]').should('be.visible');
        cy.get('[data-cy="error-password"]').should('be.visible');

        // Verify still on login page
        cy.url().should('include', '/login');
    });

    it('should show validation error when only email is filled', () => {
        // Fill only email field
        cy.get('[data-cy="input-email"]').type('test@t.ca');

        // Submit the form
        cy.get('[data-cy="login-submit"]').click();

        // Verify password error is shown
        cy.get('[data-cy="error-password"]').should('be.visible');

        // Verify still on login page
        cy.url().should('include', '/login');
    });

    it('should show validation error when only password is filled', () => {
        // Fill only password field
        cy.get('[data-cy="input-password"]').type('123456Pw');

        // Submit the form
        cy.get('[data-cy="login-submit"]').click();

        // Verify email error is shown
        cy.get('[data-cy="error-email"]').should('be.visible');

        // Verify still on login page
        cy.url().should('include', '/login');
    });


    it('should show validation error for invalid email format', () => {
        // Enter invalid email format
        cy.get('[data-cy="input-email"]').type('invalid-email');
        cy.get('[data-cy="input-password"]').type('123456Pw');

        // Submit the form
        cy.get('[data-cy="login-submit"]').click();

        // Verify email validation error is shown
        cy.get('[data-cy="error-email"]').should('be.visible');

        // Verify still on login page
        cy.url().should('include', '/login');
    });

    it('should show validation error for password too short', () => {
        // Enter valid email but short password
        cy.get('[data-cy="input-email"]').type('test@t.ca');
        cy.get('[data-cy="input-password"]').type('123');

        // Submit the form
        cy.get('[data-cy="login-submit"]').click();

        // Verify password validation error is shown
        cy.get('[data-cy="error-password"]').should('be.visible');

        // Verify still on login page
        cy.url().should('include', '/login');
    });

    it('should persist session after successful login', () => {
        // Login with valid credentials
        cy.get('[data-cy="input-email"]').type('test@t.ca');
        cy.get('[data-cy="input-password"]').type('123456Pw');
        cy.get('[data-cy="login-submit"]').click();

        // Wait for redirect
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        // Reload the page
        cy.reload();

        // Verify still logged in (navbar visible, not redirected to login)
        cy.get('[data-cy="navbar"]').should('be.visible');
        cy.url().should('not.include', '/login');
    });

    it('should logout successfully and clear session', () => {
        // First login
        cy.get('[data-cy="input-email"]').type('test@t.ca');
        cy.get('[data-cy="input-password"]').type('123456Pw');
        cy.get('[data-cy="login-submit"]').click();

        // Wait for redirect to home
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        // Click user menu and logout
        cy.get('[data-cy="user-menu"]').click();
        cy.get('[data-cy="logout-btn"]').click();

        // Verify redirected to login page
        cy.url().should('include', '/login');

        // Verify token is cleared
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.be.null;
        });
    });

});