import os
from datetime import datetime
import uuid

from sqlalchemy import desc

from database.db import Session
from schemas.assignment_model import Assignment
from schemas.course_model import Course
from services.config import ASSIGNMENT_UPLOAD_DIR, COURSE_UPLOAD_DIR
from utilities.assignment_validation import validate_assignment_json
from utilities.course_validation import validate_course_json, check_course_overlap
from utilities.expand_course import expand_course
from utilities.file_validation import validate_file
from utilities.format_assignment import format_assignment


def insert_course(course, file_data=None, filename=None, content_type=None):
    """Given a course JSON object, insert it into the database"""

    validate_course_json(course)
    check_course_overlap(course)

    if file_data and filename:
        validate_file(filename, content_type, len(file_data))

    with Session() as session:
        file_path = None

        # if the file parameters exist, there must be a file
        if file_data and filename:
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = COURSE_UPLOAD_DIR / unique_filename

            # Ensure directory exists
            COURSE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

            # Write the file
            with open(file_path, "wb") as f:
                f.write(file_data)

        # Convert string dates to Python date objects
        start_date = datetime.strptime(course["startDate"], "%Y-%m-%d").date()
        end_date = datetime.strptime(course["endDate"], "%Y-%m-%d").date()

        # Convert string times to Python time objects
        start_time = datetime.strptime(course["startTime"], "%H:%M:%S").time()
        end_time = datetime.strptime(course["endTime"], "%H:%M:%S").time()

        # Convert credits to integer
        credits = int(course["credits"])

        new_course = Course(
            courseName=course["courseName"],
            credits=credits,
            startDate=start_date,
            endDate=end_date,
            daysOfWeek=course["daysOfWeek"],
            startTime=start_time,
            endTime=end_time,
            filename=filename,
            file_path=str(file_path) if file_path else None,
            content_type=content_type
        )

        session.add(new_course)
        session.commit()
        session.refresh(new_course)

        # Return success with course ID
        return new_course


def insert_assignment(assignment, file_data=None, filename=None, content_type=None):
    """Given an assignment JSON object, insert it into the database"""

    validate_assignment_json(assignment)

    if file_data and filename:
        validate_file(filename, content_type, len(file_data))

    with Session() as session:
        file_path = None

        # If the file parameters exist, there must be a file
        if file_data and filename:
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = ASSIGNMENT_UPLOAD_DIR / unique_filename

            # Make sure directory exists
            ASSIGNMENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

            # Write the file in binary to the given file path
            with open(file_path, "wb") as f:
                f.write(file_data)

        # Convert string date to Python date object
        due_date = datetime.strptime(assignment["dueDate"], "%Y-%m-%d").date()

        # Convert string time to Python time object
        due_time = datetime.strptime(assignment["dueTime"], "%H:%M:%S").time()

        # Convert courseId to integer
        course_id = int(assignment["courseId"])

        # Create an assignment entry in the SQLite database
        new_assignment = Assignment(
            assignmentTitle=assignment["assignmentTitle"],
            courseId=course_id,
            dueDate=due_date,
            dueTime=due_time,
            filename=filename,
            file_path=str(file_path) if file_path else None,
            content_type=content_type
        )

        session.add(new_assignment)
        session.commit()
        session.refresh(new_assignment)

        # Return success with assignment ID
        return new_assignment


def retrieve_latest_course():
    with Session() as session:
        course_events = []
        target_course = session.query(Course).order_by(desc(Course.id)).first()

        if target_course:
            course_events.extend(expand_course(target_course))

        return course_events


def retrieve_latest_assignment():
    """Retrieve the most recent assignment from the database"""
    with Session() as session:
        target_assignment = session.query(Assignment).order_by(desc(Assignment.id)).first()

        if target_assignment:
            return [format_assignment(target_assignment)]

        return []


def get_all_courses():
    """Retrieve all courses from the database"""
    with Session() as session:
        courses = session.query(Course).all()
        return courses


def get_all_assignments():
    """Retrieve all assignments from the database"""
    with Session() as session:
        assignments = session.query(Assignment).all()
        return assignments