from datetime import datetime, time

def format_exam(exam_obj):
    """
    returns an exam object to be used for the front-end calendar
    """

    #default times set to 9am-10am
    start = datetime.combine(exam_obj.dateOf, time(9, 0, 0))
    end = datetime.combine(exam_obj.dateOf, time(10, 0, 0))

    return {
        "title": exam_obj.title,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "allDay": False,

    }