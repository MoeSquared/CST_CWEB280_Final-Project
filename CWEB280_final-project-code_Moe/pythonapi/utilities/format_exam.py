from datetime import datetime, time

def format_exam(exam_obj):
    """
    returns an exam object to be used for the front-end calendar
    """

    #default times set to 9am-10am
    start = datetime.combine(exam_obj.dateOf, time(9, 0, 0))
    end = datetime.combine(exam_obj.dateOf, time(10, 0, 0))

    return {
        "id": exam_obj.id,
        "title": exam_obj.title,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "date": exam_obj.dateOf.isoformat(),
        "allDay": False,
        "type": "exam",
        "courseId": exam_obj.courseId,
        "weight": exam_obj.weight
    }