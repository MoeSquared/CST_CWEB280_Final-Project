from datetime import datetime


def validate_assignment_json(assignment):
    """Method to validate that an assignment JSON object is in a database-friendly format"""
    # Check for required fields that match what sqlite_manager expects
    required_keys = ["assignmentTitle", "courseId", "dueDate", "dueTime"]
    for key in required_keys:
        if key not in assignment:
            raise ValueError(f"Missing required field: {key}")

    # Validate date format (YYYY-MM-DD)
    try:
        datetime.strptime(assignment["dueDate"], "%Y-%m-%d")
    except (ValueError, TypeError):
        raise ValueError(f"Assignment dueDate is not a valid date (expected format: YYYY-MM-DD)")

    # Validate time format (HH:MM:SS)
    try:
        datetime.strptime(assignment["dueTime"], "%H:%M:%S")
    except (ValueError, TypeError):
        raise ValueError(f"Assignment dueTime is not a valid time (expected format: HH:MM:SS)")

    # Validate courseId is a number
    try:
        int(assignment["courseId"])
    except (ValueError, TypeError):
        raise ValueError(f"courseId must be a valid number")