from datetime import date, time, timedelta
from database.db import Session
from schemas.course_model import Course
from schemas.assignment_model import Assignment
from schemas.exam_model import Exam
from schemas.student_course_model import StudentCourse
from schemas.student_model import Student
from schemas.user_model import User


def init_seed_data():
    """
    Initialize seed data for courses and assignments.
    Creates sample academic data for testing the application.
    """
    with Session() as session:
        # Check if seed data already exists
        existing_courses = session.query(Course).count()
        if existing_courses > 0:
            print("Seed data already exists, skipping...")
            return

        print("Creating seed data...")

        today = date.today()

        # Semester dates
        semester_start = date(2026, 1, 5)
        semester_end = date(2026, 4, 30)

        # COURSES

        # Course 1: CWEB280 Web Development
        cweb280 = Course(
            courseName="CWEB280",
            credits=3,
            startDate=semester_start,
            endDate=semester_end,
            daysOfWeek="M,W",
            startTime=time(8, 0, 0),
            endTime=time(10, 0, 0)
        )
        session.add(cweb280)


        cosc286 = Course(
            courseName="COSC286",
            credits=3,
            startDate=semester_start,
            endDate=semester_end,
            daysOfWeek="Tu,Th",
            startTime=time(10, 0, 0),
            endTime=time(12, 0, 0)
        )
        session.add(cosc286)


        session.commit()
        session.refresh(cweb280)
        session.refresh(cosc286)

        print(f"Created courses: CWEB280 (id={cweb280.id}), COSC286 (id={cosc286.id})")


        # Assignments

        # CWEB280 - Assignment 1
        cweb_assignment1 = Assignment(
            assignmentTitle="Release 2",
            courseId=cweb280.id,
            dueDate=today + timedelta(days=7),
            dueTime=time(23, 59, 0)
        )
        session.add(cweb_assignment1)

        # CWEB280 - Assignment 2
        cweb_assignment2 = Assignment(
            assignmentTitle="Release 3",
            courseId=cweb280.id,
            dueDate=today + timedelta(days=21),
            dueTime=time(23, 59, 0)
        )
        session.add(cweb_assignment2)

        # COSC286 - Assignment 1
        cosc_assignment1 = Assignment(
            assignmentTitle="Graphs",
            courseId=cosc286.id,
            dueDate=today + timedelta(days=10),
            dueTime=time(23, 59, 0)
        )
        session.add(cosc_assignment1)

        session.commit()
        print(f"Created 3 assignments")

        # Exams

        cweb_midterm = Exam(
            title="CWEB280 Midterm",
            dateOf=today + timedelta(days=14),
            weight=20.0,
            courseId=cweb280.id
        )
        session.add(cweb_midterm)


        cweb_final = Exam(
            title="CWEB280 Final",
            dateOf=today + timedelta(days=45),
            weight=30.0,
            courseId=cweb280.id
        )
        session.add(cweb_final)


        cosc_midterm = Exam(
            title="COSC286 Midterm",
            dateOf=today + timedelta(days=16),
            weight=25.0,
            courseId=cosc286.id
        )
        session.add(cosc_midterm)

        # COSC286 - Final
        cosc_final = Exam(
            title="COSC286 Final",
            dateOf=today + timedelta(days=50),
            weight=35.0,
            courseId=cosc286.id
        )
        session.add(cosc_final)

        session.commit()
        print(f"Created 4 exams")



        # Students

        # Get the test admin user
        test_user = session.query(User).filter_by(email="test@t.ca").first()

        if test_user:
            # Create a student record for the test user
            test_student = Student(
                firstName="Test",
                lastName="McTester",
                userId=test_user.id
            )
            session.add(test_student)
            session.commit()
            session.refresh(test_student)

            print(f"Created student for test user (id={test_student.id})")

            # enrollments
            # Enroll test student in both courses
            enrollment1 = StudentCourse(
                studentId=test_student.id,
                courseId=cweb280.id
            )
            session.add(enrollment1)

            enrollment2 = StudentCourse(
                studentId=test_student.id,
                courseId=cosc286.id
            )
            session.add(enrollment2)

            session.commit()
            print(f"Created 2 enrollments for test student")

        print("Seed data created")


