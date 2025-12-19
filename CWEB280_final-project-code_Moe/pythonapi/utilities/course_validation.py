import os
from datetime import datetime

from database.db import Session
from schemas.course_model import Course


def check_course_overlap(course):
    """Method to check if a JSON course overlaps with a course in the database"""
    entry_start_date = datetime.strptime(course["startDate"], "%Y-%m-%d").date()
    entry_end_date = datetime.strptime(course["endDate"], "%Y-%m-%d").date()
    entry_start_time = datetime.strptime(course["startTime"], "%H:%M:%S").time()
    entry_end_time = datetime.strptime(course["endTime"], "%H:%M:%S").time()
    entry_days = course["daysOfWeek"].split(",")

    with Session() as session:
        existing_courses = session.query(Course).all()

        for existing in existing_courses:
            # Checking overlap of dates
            date_overlap = entry_start_date <= existing.endDate and entry_end_date >= existing.startDate

            if not date_overlap:
                continue

            # Checking overlap of days
            day_overlap = False
            existing_days = existing.daysOfWeek.split(",")

            for day in entry_days:
                if day in existing_days:
                    day_overlap = True
                    break

            if not day_overlap:
                continue

            # Checking overlap of times
            time_overlap = entry_start_time < existing.endTime and entry_end_time > existing.startTime

            if not time_overlap:
                continue

            # If we get here, all three overlaps exist
            raise ValueError(
                f"Error: This course conflicts with '{existing.courseName}' "
                f"(Dates: {existing.startDate} to {existing.endDate}, "
                f"Days: {existing.daysOfWeek}, "
                f"Time: {existing.startTime} to {existing.endTime})"
            )