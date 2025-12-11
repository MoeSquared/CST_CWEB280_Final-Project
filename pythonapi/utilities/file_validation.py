import os


def validate_file(filename, content_type, file_size):
    # Check content type
    valid_type = "application/pdf"


    if content_type != valid_type:
        raise ValueError(f"Content type {content_type} is not valid")

    # Check file extension
    valid_extension = ".pdf"
    file_ext = os.path.splitext(filename)[1].lower()

    if file_ext != valid_extension:
        raise ValueError(f"File extension {file_ext} is not valid")

    # Check file size
    max_size = 5 * 1024 * 1024
    if file_size > max_size:
        raise ValueError(f"File size must be less than 5MB")
