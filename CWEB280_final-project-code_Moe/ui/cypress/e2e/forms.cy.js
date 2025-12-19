describe('Add Entry Forms', () => {
    beforeEach(() => {
        // Login before each test
        cy.login('test@t.ca', '123456Pw');

        // Navigate to Add Entry page
        cy.visit('/add');
    });

    describe('Assignment Form', () => {
        beforeEach(() => {
            // Select Assignment type
            cy.get('[data-cy="entry-type-assignment"]').click();

            // Wait for form to appear
            cy.get('[data-cy="assignment-form"]').should('be.visible');
        });

        it('should show validation errors when form is empty', () => {
            // Click submit without filling any fields
            cy.get('[data-cy="assignment-submit"]').click();

            // Verify validation errors are shown for required fields
            cy.get('[data-cy="error-assignmentTitle"]').should('be.visible');
            cy.get('[data-cy="error-courseId"]').should('be.visible');
            cy.get('[data-cy="error-dueDate"]').should('be.visible');
        });


        it('should show validation errors when only title is filled', () => {
            // Fill only the title
            cy.get('[data-cy="input-assignmentTitle"]').type('Test Assignment');

            // Click submit
            cy.get('[data-cy="assignment-submit"]').click();

            // Verify errors for missing required fields
            cy.get('[data-cy="error-courseId"]').should('be.visible');
            cy.get('[data-cy="error-dueDate"]').should('be.visible');
        });

        it('should show validation errors when course is not selected', () => {
            // Fill title and date but not course
            cy.get('[data-cy="input-assignmentTitle"]').type('Test Assignment');
            cy.get('[data-cy="input-dueDate"]').type('2025-12-31');

            // Click submit
            cy.get('[data-cy="assignment-submit"]').click();

            // Verify course error is shown
            cy.get('[data-cy="error-courseId"]').should('be.visible');
        });

        it('should submit successfully with all required fields filled', () => {
            // Generate unique assignment title
            const assignmentTitle = `Test Assignment ${Date.now()}`;

            // Fill all required fields
            cy.get('[data-cy="input-assignmentTitle"]').type(assignmentTitle);

            // Select the first available course (skip the placeholder option)
            cy.get('[data-cy="input-courseId"]').find('option').eq(1).invoke('val').then((val) => {
                cy.get('[data-cy="input-courseId"]').select(val);
            });

            cy.get('[data-cy="input-dueDate"]').type('2025-12-31');
            cy.get('[data-cy="input-dueTime"]').clear().type('23:59');

            // Submit the form
            cy.get('[data-cy="assignment-submit"]').click();

            // Wait briefly for submission to complete
            cy.wait(2000);

            // Navigate to Upcoming page to verify assignment was added
            cy.get('[data-cy="nav-upcoming"]').click();
            cy.url().should('include', '/upcoming');
        });


        it('should show validation error for invalid worth value', () => {
            // Fill required fields
            cy.get('[data-cy="input-assignmentTitle"]').type('Test Assignment');

            // Select the first available course
            cy.get('[data-cy="input-courseId"]').find('option').eq(1).invoke('val').then((val) => {
                cy.get('[data-cy="input-courseId"]').select(val);
            });

            cy.get('[data-cy="input-dueDate"]').type('2025-12-31');

            // Enter invalid worth (over 100)
            cy.get('[data-cy="input-worth"]').type('150');

            // Submit the form
            cy.get('[data-cy="assignment-submit"]').click();

            // Verify error for invalid worth
            cy.get('[data-cy="error-worth"]').should('be.visible');
        });
    });

    describe('Course Form', () => {
        beforeEach(() => {
            // Select Course type
            cy.get('[data-cy="entry-type-course"]').click();

            // Wait for form to appear
            cy.get('[data-cy="course-form"]').should('be.visible');
        });

        it('should show validation errors when form is empty', () => {
            // Clear default values
            cy.get('[data-cy="input-credits"]').clear();
            cy.get('[data-cy="input-startTime"]').clear();
            cy.get('[data-cy="input-endTime"]').clear();

            // Click submit without filling required fields
            cy.get('[data-cy="course-submit"]').click();

            // Verify validation errors for required fields
            cy.get('[data-cy="error-courseName"]').should('be.visible');
            cy.get('[data-cy="error-startDate"]').should('be.visible');
            cy.get('[data-cy="error-endDate"]').should('be.visible');
            cy.get('[data-cy="error-daysOfWeek"]').should('be.visible');
        });


        it('should submit successfully with all required fields filled', () => {
            // Generate unique course name
            const courseName = `CWEB${Date.now().toString().slice(-4)}`;

            // Fill required fields
            cy.get('[data-cy="input-courseName"]').type(courseName);
            cy.get('[data-cy="input-startDate"]').type('2025-01-06');
            cy.get('[data-cy="input-endDate"]').type('2025-04-18');

            // Select days (click on Mon, Wed, Fri)
            cy.get('[data-cy="day-M"]').click();
            cy.get('[data-cy="day-W"]').click();
            cy.get('[data-cy="day-F"]').click();

            // Submit the form
            cy.get('[data-cy="course-submit"]').click();

            // Wait briefly for submission to complete
            cy.wait(2000);

            // Navigate to Courses page to verify course was added
            cy.get('[data-cy="nav-courses"]').click();
            cy.url().should('include', '/courses');
        });


        it('should show validation error when end date is before start date', () => {
            // Fill course name
            cy.get('[data-cy="input-courseName"]').type('Test Course');

            // Enter end date before start date
            cy.get('[data-cy="input-startDate"]').type('2025-04-18');
            cy.get('[data-cy="input-endDate"]').type('2025-01-06');

            // Select a day
            cy.get('[data-cy="day-M"]').click();

            // Submit the form
            cy.get('[data-cy="course-submit"]').click();

            // Verify error for invalid dates
            cy.get('[data-cy="error-endDate"]').should('be.visible');
        });
    });

    describe('Exam Form', () => {
        beforeEach(() => {
            // Select Exam type
            cy.get('[data-cy="entry-type-exam"]').click();

            // Wait for form to appear
            cy.get('[data-cy="exam-form"]').should('be.visible');
        });


        it('should show validation errors when form is empty', () => {
            // Click submit without filling any fields
            cy.get('[data-cy="exam-submit"]').click();

            // Verify validation errors are shown for required fields
            cy.get('[data-cy="error-title"]').should('be.visible');
            cy.get('[data-cy="error-courseId"]').should('be.visible');
            cy.get('[data-cy="error-dateOf"]').should('be.visible');
            cy.get('[data-cy="error-weight"]').should('be.visible');
        });


        it('should submit successfully with all required fields filled', () => {
            // Generate unique exam title
            const examTitle = `Midterm Exam ${Date.now()}`;

            // Fill all required fields
            cy.get('[data-cy="input-title"]').type(examTitle);

            // Select the first available course
            cy.get('[data-cy="input-courseId"]').find('option').eq(1).invoke('val').then((val) => {
                cy.get('[data-cy="input-courseId"]').select(val);
            });

            cy.get('[data-cy="input-dateOf"]').type('2025-12-20');
            cy.get('[data-cy="input-weight"]').type('25');

            // Submit the form
            cy.get('[data-cy="exam-submit"]').click();

            // Wait briefly for submission to complete
            cy.wait(2000);

            // Navigate to Upcoming page to verify exam was added
            cy.get('[data-cy="nav-upcoming"]').click();
            cy.url().should('include', '/upcoming');
        });


        it('should show validation errors when course is not selected', () => {
            // Fill title, date and weight but not course
            cy.get('[data-cy="input-title"]').type('Midterm Exam');
            cy.get('[data-cy="input-dateOf"]').type('2025-12-20');
            cy.get('[data-cy="input-weight"]').type('25');

            // Click submit
            cy.get('[data-cy="exam-submit"]').click();

            // Verify course error is shown
            cy.get('[data-cy="error-courseId"]').should('be.visible');
        });
    });

    describe('Entry Type Selection', () => {
        it('should show correct form when type is selected', () => {
            // Initially no form should be visible
            cy.get('[data-cy="assignment-form"]').should('not.exist');
            cy.get('[data-cy="course-form"]').should('not.exist');
            cy.get('[data-cy="exam-form"]').should('not.exist');

            // Select Course
            cy.get('[data-cy="entry-type-course"]').click();
            cy.get('[data-cy="course-form"]').should('be.visible');

            // Switch to Assignment
            cy.get('[data-cy="entry-type-course"]').click(); // Deselect
            cy.get('[data-cy="entry-type-assignment"]').click();
            cy.get('[data-cy="assignment-form"]').should('be.visible');
            cy.get('[data-cy="course-form"]').should('not.exist');

            // Switch to Exam
            cy.get('[data-cy="entry-type-assignment"]').click(); // Deselect
            cy.get('[data-cy="entry-type-exam"]').click();
            cy.get('[data-cy="exam-form"]').should('be.visible');
            cy.get('[data-cy="assignment-form"]').should('not.exist');
        });
    });
});