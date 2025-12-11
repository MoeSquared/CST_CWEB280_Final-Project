describe('Authentication Tests', () => {

    beforeEach(() => {
        // Clear localStorage before each test
        cy.clearLocalStorage();
    });
    

    describe('Login Page', () => {
        
        beforeEach(() => {
            cy.visit('http://localhost:5173/login');
        });

        it('Empty form submission - should show validation and not navigate', () => {
            // Click submit with empty fields
            cy.get('button[type="submit"]').click();

            // Should stay on login page (form not submitted)
            cy.url().should('include', '/login');

            // Page should still show login form
            cy.get('#email').should('be.visible');
            cy.get('#password').should('be.visible');
        });

        it('Not all fields filled - should not submit form', () => {
            // Only fill email, leave password empty
            cy.get('#email').type('test@t.ca');
            cy.get('button[type="submit"]').click();

            // Should stay on login page
            cy.url().should('include', '/login');

            // Clear email and try with only password
            cy.get('#email').clear();
            cy.get('#password').type('123456Pw');
            cy.get('button[type="submit"]').click();

            // Should still stay on login page
            cy.url().should('include', '/login');
        });

        it('Wrong credentials - should show error alert and not allow entry', () => {
            // Enter incorrect credentials
            cy.get('#email').type('wrong@email.com');
            cy.get('#password').type('wrongpassword');
            cy.get('button[type="submit"]').click();

            // Should show error alert
            cy.get('.alert-danger').should('be.visible');

            // Should stay on login page
            cy.url().should('include', '/login');

            // Should NOT have token in localStorage
            cy.window().then((win) => {
                expect(win.localStorage.getItem('token')).to.be.null;
            });
        });

        it('Correct credentials - should login and redirect to home', () => {
            // Enter correct credentials (test admin user)
            cy.get('#email').type('test@t.ca');
            cy.get('#password').type('123456Pw');
            cy.get('button[type="submit"]').click();

            // Should redirect to home page
            cy.url().should('eq', 'http://localhost:5173/');

            // Should have token in localStorage
            cy.window().then((win) => {
                expect(win.localStorage.getItem('token')).to.not.be.null;
                expect(win.localStorage.getItem('userEmail')).to.eq('test@t.ca');
            });

            // Should show navbar with user info
            cy.get('.navbar').should('be.visible');
        });

        it('Navigate to register page from login', () => {
            cy.get('a[href="/register"]').click();
            cy.url().should('include', '/register');
        });
    });


    describe('Registration Page', () => {

        beforeEach(() => {
            cy.visit('http://localhost:5173/register');
        });

        it('Empty form submission - should show validation errors', () => {
            // Click submit with empty fields
            cy.get('button[type="submit"]').click();

            // Should show validation errors
            cy.get('#name').should('have.class', 'is-invalid');
            cy.get('#email').should('have.class', 'is-invalid');
            cy.get('#password').should('have.class', 'is-invalid');
            cy.get('#confirmPassword').should('have.class', 'is-invalid');

            // Should show error messages
            cy.get('.invalid-feedback').should('have.length.at.least', 1);

            // Should stay on register page
            cy.url().should('include', '/register');
        });

        it('Not all fields filled - should show validation for missing fields', () => {
            // Fill only some fields
            cy.get('#name').type('Test User');
            cy.get('#email').type('newuser@test.com');
            // Leave password fields empty

            cy.get('button[type="submit"]').click();

            // Should show validation errors for password fields
            cy.get('#password').should('have.class', 'is-invalid');
            cy.get('#confirmPassword').should('have.class', 'is-invalid');

            // Should stay on register page
            cy.url().should('include', '/register');
        });

        it('Invalid email format - should show email validation error', () => {
            cy.get('#name').type('Test User');
            cy.get('#email').type('invalidemail');  // Invalid email
            cy.get('#password').type('password123');
            cy.get('#confirmPassword').type('password123');

            cy.get('button[type="submit"]').click();

            // Should show email validation error
            cy.get('#email').should('have.class', 'is-invalid');
            cy.get('.invalid-feedback').should('be.visible');
        });

        it('Password too short - should show password validation error', () => {
            cy.get('#name').type('Test User');
            cy.get('#email').type('newuser@test.com');
            cy.get('#password').type('123');  // Too short
            cy.get('#confirmPassword').type('123');

            cy.get('button[type="submit"]').click();

            // Should show password length error
            cy.get('#password').should('have.class', 'is-invalid');
        });

        it('Passwords do not match - should show confirmation error', () => {
            cy.get('#name').type('Test User');
            cy.get('#email').type('newuser@test.com');
            cy.get('#password').type('password123');
            cy.get('#confirmPassword').type('differentpassword');

            cy.get('button[type="submit"]').click();

            // Should show password mismatch error
            cy.get('#confirmPassword').should('have.class', 'is-invalid');
        });

        it('Valid registration - should create account and redirect', () => {
            // Generate unique email to avoid "already registered" error
            const uniqueEmail = `testuser_${Date.now()}@test.com`;

            cy.get('#name').type('New Test User');
            cy.get('#email').type(uniqueEmail);
            cy.get('#password').type('password123');
            cy.get('#confirmPassword').type('password123');

            cy.get('button[type="submit"]').click();

            // Should redirect to home page after successful registration
            cy.url().should('eq', 'http://localhost:5173/');

            // Should have token in localStorage
            cy.window().then((win) => {
                expect(win.localStorage.getItem('token')).to.not.be.null;
                expect(win.localStorage.getItem('userEmail')).to.eq(uniqueEmail);
            });
        });

        it('Duplicate email - should show server error', () => {
            // Try to register with existing email
            cy.get('#name').type('Duplicate User');
            cy.get('#email').type('test@t.ca');  // Already exists
            cy.get('#password').type('password123');
            cy.get('#confirmPassword').type('password123');

            cy.get('button[type="submit"]').click();

            // Should show server error alert
            cy.get('.alert-danger').should('be.visible');

            // Should stay on register page
            cy.url().should('include', '/register');
        });

        it('Navigate to login page from register', () => {
            cy.get('a[href="/login"]').click();
            cy.url().should('include', '/login');
        });
    });

    

    describe('Logout Functionality', () => {

        beforeEach(() => {
            // Login first
            cy.visit('http://localhost:5173/login');
            cy.get('#email').type('test@t.ca');
            cy.get('#password').type('123456Pw');
            cy.get('button[type="submit"]').click();
            cy.url().should('eq', 'http://localhost:5173/');
        });

        it('Logout - should clear session and redirect to login', () => {
            // Open user dropdown and click logout
            cy.get('.dropdown-toggle').click();
            cy.get('.dropdown-item.text-danger').click();

            // Should redirect to login page
            cy.url().should('include', '/login');

            // Should clear localStorage
            cy.window().then((win) => {
                expect(win.localStorage.getItem('token')).to.be.null;
                expect(win.localStorage.getItem('userEmail')).to.be.null;
            });
        });
    });


    describe('Protected Routes', () => {

        it('Unauthenticated user - should redirect to login when accessing protected route', () => {
            cy.clearLocalStorage();
            cy.visit('http://localhost:5173/calendar');

            // Should redirect to login
            cy.url().should('include', '/login');
        });

        it('Unauthenticated user - should redirect from admin page', () => {
            cy.clearLocalStorage();
            cy.visit('http://localhost:5173/admin');

            // Should redirect to login
            cy.url().should('include', '/login');
        });

        it('Non-admin user - should redirect from admin page to home', () => {

            const regularEmail = `regular_${Date.now()}@test.com`;

            cy.visit('http://localhost:5173/register');
            cy.get('#name').type('Regular User');
            cy.get('#email').type(regularEmail);
            cy.get('#password').type('password123');
            cy.get('#confirmPassword').type('password123');
            cy.get('button[type="submit"]').click();

            // Wait for redirect to home
            cy.url().should('eq', 'http://localhost:5173/');

            // Try to access admin page
            cy.visit('http://localhost:5173/admin');

            // Should redirect to home (not admin)
            cy.url().should('eq', 'http://localhost:5173/');
        });
    });
});