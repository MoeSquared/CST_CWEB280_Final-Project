from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import os
import json

from database.db import Session
from schemas.assignment_model import Assignment
from schemas.course_model import Course
from middlewares.auth_middleware import require_auth
from services.config import ASSIGNMENT_UPLOAD_DIR

router = APIRouter(prefix="/api", tags=["assignments"])

# Ensure upload directory exists
ASSIGNMENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class AssignmentCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Assignment title")
    description: Optional[str] = Field(None, description="Assignment description")
    courseId: int = Field(..., gt=0, description="Course ID")
    dueDate: str = Field(..., description="Due date in YYYY-MM-DD format")
    dueTime: str = Field(..., description="Due time in HH:MM:SS format")
    worth: Optional[float] = Field(None, ge=0, le=100, description="Worth as percentage (0-100)")

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Assignment title cannot be empty')
        return v.strip()

    @field_validator('dueDate')
    @classmethod
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError('dueDate must be in YYYY-MM-DD format')
        return v

    @field_validator('dueTime')
    @classmethod
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, "%H:%M:%S")
        except ValueError:
            raise ValueError('dueTime must be in HH:MM:SS format')
        return v


class AssignmentUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    courseId: Optional[int] = Field(None, gt=0)
    dueDate: Optional[str] = None
    dueTime: Optional[str] = None
    worth: Optional[float] = Field(None, ge=0, le=100)

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Assignment title cannot be empty')
        return v.strip() if v else v

    @field_validator('dueDate')
    @classmethod
    def validate_date_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError('dueDate must be in YYYY-MM-DD format')
        return v

    @field_validator('dueTime')
    @classmethod
    def validate_time_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, "%H:%M:%S")
            except ValueError:
                raise ValueError('dueTime must be in HH:MM:SS format')
        return v


def format_assignment(assignment_obj):
    """Format an assignment object for front-end use"""
    # Get course name
    with Session() as session:
        course = session.query(Course).filter_by(id=assignment_obj.courseId).first()
        course_name = course.courseName if course else "Unknown"

    # Create datetime for calendar
    due_datetime = datetime.combine(assignment_obj.dueDate, assignment_obj.dueTime)

    return {
        "id": assignment_obj.id,
        "originalId": assignment_obj.id,
        "title": assignment_obj.assignmentTitle,
        "name": assignment_obj.assignmentTitle,
        "description": assignment_obj.description,
        "start": due_datetime.isoformat(),
        "end": due_datetime.isoformat(),
        "date": assignment_obj.dueDate.isoformat(),
        "allDay": False,
        "type": "assignment",
        "courseId": assignment_obj.courseId,
        "code": course_name,
        "color": "#dc3545",
        "worth": assignment_obj.worth,
        "hasFile": bool(assignment_obj.file_path)
    }


@router.get("/assignments")
async def get_assignments(user: dict = Depends(require_auth)):
    """Get all assignments from the database"""
    assignment_events = []

    with Session() as session:
        assignments = session.query(Assignment).all()
        for assignment in assignments:
            assignment_events.append(format_assignment(assignment))

    return assignment_events


@router.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: int, user: dict = Depends(require_auth)):
    """Get a single assignment by ID"""
    with Session() as session:
        assignment = session.query(Assignment).filter_by(id=assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        return {
            "id": assignment.id,
            "title": assignment.assignmentTitle,
            "description": assignment.description,
            "courseId": assignment.courseId,
            "dueDate": assignment.dueDate.isoformat() if assignment.dueDate else None,
            "dueTime": assignment.dueTime.isoformat() if assignment.dueTime else None,
            "worth": assignment.worth,
            "filename": assignment.filename,
            "hasFile": bool(assignment.file_path)
        }


@router.post("/accept-assignment")
async def create_assignment(
    assignment_form: str = Form(...),
    file: UploadFile = File(None),
    user: dict = Depends(require_auth)
):
    """Create a new assignment with optional file upload"""
    try:
        # Parse and validate assignment data using Pydantic
        assignment_dict = json.loads(assignment_form)
        assignment_data = AssignmentCreateRequest(**assignment_dict)

        with Session() as session:
            # Verify that the course exists
            course = session.query(Course).filter_by(id=assignment_data.courseId).first()
            if not course:
                raise HTTPException(status_code=400, detail="Course not found")

            # Convert string date/time to Python objects
            due_date = datetime.strptime(assignment_data.dueDate, "%Y-%m-%d").date()
            due_time = datetime.strptime(assignment_data.dueTime, "%H:%M:%S").time()

            # Create the assignment
            new_assignment = Assignment(
                assignmentTitle=assignment_data.title,
                description=assignment_data.description,
                courseId=assignment_data.courseId,
                dueDate=due_date,
                dueTime=due_time,
                worth=assignment_data.worth
            )

            # Handle file upload
            if file and file.filename:
                filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
                file_path = ASSIGNMENT_UPLOAD_DIR / filename

                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)

                new_assignment.filename = file.filename
                new_assignment.file_path = str(file_path)
                new_assignment.content_type = file.content_type

            session.add(new_assignment)
            session.commit()
            session.refresh(new_assignment)

            return [format_assignment(new_assignment)]

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in assignment_form")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/assignments/{assignment_id}")
async def update_assignment(
    assignment_id: int,
    assignment_update: AssignmentUpdateRequest,
    user: dict = Depends(require_auth)
):
    """Update an existing assignment"""
    with Session() as session:
        assignment = session.query(Assignment).filter_by(id=assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Update fields if provided
        if assignment_update.title is not None:
            assignment.assignmentTitle = assignment_update.title
        if assignment_update.description is not None:
            assignment.description = assignment_update.description
        if assignment_update.courseId is not None:
            # Verify course exists
            course = session.query(Course).filter_by(id=assignment_update.courseId).first()
            if not course:
                raise HTTPException(status_code=400, detail="Course not found")
            assignment.courseId = assignment_update.courseId
        if assignment_update.dueDate is not None:
            assignment.dueDate = datetime.strptime(assignment_update.dueDate, "%Y-%m-%d").date()
        if assignment_update.dueTime is not None:
            assignment.dueTime = datetime.strptime(assignment_update.dueTime, "%H:%M:%S").time()
        if assignment_update.worth is not None:
            assignment.worth = assignment_update.worth

        session.commit()
        session.refresh(assignment)

        return format_assignment(assignment)


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    user: dict = Depends(require_auth)
):
    """Delete an assignment"""
    with Session() as session:
        assignment = session.query(Assignment).filter_by(id=assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Delete associated file if exists
        if assignment.file_path and os.path.exists(assignment.file_path):
            os.remove(assignment.file_path)

        session.delete(assignment)
        session.commit()

        return {"message": "Assignment deleted successfully", "id": assignment_id}


@router.get("/view-assignment/{assignment_id}")
async def view_assignment_file(assignment_id: int):
    """View an assignment's file"""
    with Session() as session:
        assignment = session.query(Assignment).filter_by(id=assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        if not assignment.file_path or not os.path.exists(assignment.file_path):
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(
            path=assignment.file_path,
            media_type=assignment.content_type or 'application/pdf',
            headers={"Content-Disposition": f"inline; filename=\"{assignment.filename}\""}
        )