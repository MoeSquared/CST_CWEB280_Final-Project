from datetime import datetime


def format_assignment(assignment_obj):
    """Format an assignment object for front-end calendar use"""
    start = datetime.combine(assignment_obj.dueDate, assignment_obj.dueTime)
    return {
        "title": assignment_obj.assignmentTitle,
        "start": start.isoformat(),
        "end": start.isoformat(),
        "allDay": False,
        "id": assignment_obj.id,
        "type": "assignment",
        "courseId": assignment_obj.courseId,
        "filename": assignment_obj.filename,
        "has_file": assignment_obj.file_path is not None
    }
