from datetime import datetime


def validate_exam_json(exam):
    """Method to validate that an exam JSON object is in a database-friendly format"""
    # Check for required fields
    required_keys = ["title", "dateOf", "weight", "courseId"]
    for key in required_keys:
        if key not in exam:
            raise ValueError(f"Missing required field: {key}")

    # check that title is not empty
    if not exam["title"] or not exam["title"].strip():
        raise ValueError("Title cannot be empty")

    # Validate date format (YYYY-MM-DD)
    try:
        datetime.strptime(exam["dateOf"], "%Y-%m-%d")
    except (ValueError, TypeError):
        raise ValueError(f"dateOf is not a valid date (expected format: YYYY-MM-DD)")

    # Validate weight is a number between 0 and 100
    try:
        weight = float(exam["weight"])
        if weight < 0 or weight > 100:
            raise ValueError("weight must be between 0 and 100")
    except (ValueError, TypeError):
        raise ValueError(f"weight must be a valid number between 0 and 100")

    # Validate courseId is a number
    try:
        int(exam["courseId"])
    except (ValueError, TypeError):
        raise ValueError(f"courseId must be a valid number")