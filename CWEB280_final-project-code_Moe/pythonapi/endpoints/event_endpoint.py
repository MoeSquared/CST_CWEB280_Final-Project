from datetime import datetime

from fastapi import APIRouter
from fastapi.params import Depends

from database.db import Session
from endpoints.assignment_endpoint import format_assignment
from middlewares.auth_middleware import require_auth

from schemas.assignment_model import Assignment
from schemas.course_model import Course
from schemas.exam_model import Exam
from utilities.expand_course import expand_course
from utilities.format_exam import format_exam

router = APIRouter(prefix="/api", tags=["api"])

@router.get("/all")
async def get_all_events(user: dict = Depends(require_auth)):
    """Router for getting all events from the database (assignments, courses, and exams)"""
    events = []
    with Session() as session:
        #Get all courses and expand them into individual class sessions
        courses = session.query(Course).all()
        for course in courses:
            events.extend(expand_course(course))

        # get all assignments
        assignments = session.query(Assignment).all()
        for assignment in assignments:
            events.append(format_assignment(assignment))

        #get all exams/quizzes
        exams = session.query(Exam).all()
        for exam in exams:
            events.append(format_exam(exam))



    return events