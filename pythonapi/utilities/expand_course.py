from datetime import timedelta, datetime


def expand_course(course):
    """Turns a course into a bunch of singular events for front-end"""
    events = []

    current = course.startDate
    one_day = timedelta(days=1)

    while current <= course.endDate:
        weekday_number = current.weekday()

        # If the course falls on this day of the week
        if (("M" in course.daysOfWeek and weekday_number == 0) or
            ("Tu" in course.daysOfWeek and weekday_number == 1) or
            ("W" in course.daysOfWeek and weekday_number == 2) or
            ("Th" in course.daysOfWeek and weekday_number == 3) or
            ("F" in course.daysOfWeek and weekday_number == 4)):

            # Combine the date and time into front-end friendly format
            start = datetime.combine(current, course.startTime)
            end = datetime.combine(current, course.endTime)

            # Build JSON object
            events.append({
                "title": course.courseName,
                "start": start.isoformat(),
                "end": end.isoformat(),
                "allDay": False,
                "id": course.id,
                "type": "course",
                "filename": course.filename,
                "has_file": course.file_path is not None
            })

        # Go on to the next day!
        current += one_day

    return events
