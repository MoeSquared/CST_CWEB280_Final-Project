from fastapi import APIRouter, Body, HTTPException, File, UploadFile, Form, Depends
from fastapi.responses import FileResponse
from typing import Optional
from pydantic import BaseModel, field_validator, Field
from datetime import datetime
import json
import os

from database.db import Session
from schemas.course_model import Course
from utilities.expand_course import expand_course
from middlewares.auth_middleware import require_auth
from services.config import COURSE_UPLOAD_DIR

router = APIRouter(prefix="/api", tags=["courses"])

# Ensure upload directory exists
COURSE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class CourseCreateRequest(BaseModel):
    courseName: str = Field(..., min_length=1, description="Course name/code")
    credits: int = Field(..., ge=1, le=6, description="Number of credits (1-6)")
    startDate: str = Field(..., description="Start date in YYYY-MM-DD format")
    endDate: str = Field(..., description="End date in YYYY-MM-DD format")
    daysOfWeek: str = Field(..., min_length=1, description="Days of week (e.g., 'M,W,F')")
    startTime: str = Field(..., description="Start time in HH:MM:SS format")
    endTime: str = Field(..., description="End time in HH:MM:SS format")

    @field_validator('courseName')
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Course name cannot be empty')
        return v.strip()

    @field_validator('startDate', 'endDate')
    @classmethod
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v

    @field_validator('startTime', 'endTime')
    @classmethod
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, "%H:%M:%S")
        except ValueError:
            raise ValueError('Time must be in HH:MM:SS format')
        return v

    @field_validator('daysOfWeek')
    @classmethod
    def validate_days_of_week(cls, v):
        valid_days = {'M', 'Tu', 'W', 'Th', 'F'}
        days = [d.strip() for d in v.split(',')]
        for day in days:
            if day not in valid_days:
                raise ValueError(f"Invalid day: {day}. Valid days are: M, Tu, W, Th, F")
        return v


class CourseUpdateRequest(BaseModel):
    courseName: Optional[str] = Field(None, min_length=1)
    credits: Optional[int] = Field(None, ge=1, le=6)
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    daysOfWeek: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None

    @field_validator('courseName')
    @classmethod
    def name_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Course name cannot be empty')
        return v.strip() if v else v

    @field_validator('startDate', 'endDate')
    @classmethod
    def validate_date_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError('Date must be in YYYY-MM-DD format')
        return v

    @field_validator('startTime', 'endTime')
    @classmethod
    def validate_time_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, "%H:%M:%S")
            except ValueError:
                raise ValueError('Time must be in HH:MM:SS format')
        return v

    @field_validator('daysOfWeek')
    @classmethod
    def validate_days_of_week(cls, v):
        if v is not None:
            valid_days = {'M', 'Tu', 'W', 'Th', 'F'}
            days = [d.strip() for d in v.split(',')]
            for day in days:
                if day not in valid_days:
                    raise ValueError(f"Invalid day: {day}. Valid days are: M, Tu, W, Th, F")
        return v


@router.get("/courses")
async def get_courses(user: dict = Depends(require_auth)):
    """Get all courses"""
    course_events = []

    with Session() as session:
        courses = session.query(Course).all()
        for course in courses:
            # Return basic course info (not expanded)
            course_events.append({
                "id": course.id,
                "title": course.courseName,
                "courseName": course.courseName,
                "credits": course.credits,
                "startDate": course.startDate.isoformat() if course.startDate else None,
                "endDate": course.endDate.isoformat() if course.endDate else None,
                "daysOfWeek": course.daysOfWeek,
                "startTime": course.startTime.isoformat() if course.startTime else None,
                "endTime": course.endTime.isoformat() if course.endTime else None,
                "hasFile": course.filename is not None,
                "type": "course"
            })

    return course_events


@router.get("/courses/{course_id}")
async def get_course(course_id: int, user: dict = Depends(require_auth)):
    """Get a single course by ID"""
    with Session() as session:
        course = session.query(Course).filter_by(id=course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        return {
            "id": course.id,
            "courseName": course.courseName,
            "credits": course.credits,
            "startDate": course.startDate.isoformat() if course.startDate else None,
            "endDate": course.endDate.isoformat() if course.endDate else None,
            "daysOfWeek": course.daysOfWeek,
            "startTime": course.startTime.isoformat() if course.startTime else None,
            "endTime": course.endTime.isoformat() if course.endTime else None,
            "filename": course.filename
        }


@router.post("/accept-course")
async def create_course(
        course_form: str = Form(None),
        file: UploadFile = File(None),
        user: dict = Depends(require_auth),
        course_data: dict = Body(None)
):
    """Create a new course with optional file upload"""
    try:
        # Handle both form data and JSON body
        if course_form:
            course_dict = json.loads(course_form)
        elif course_data:
            course_dict = course_data
        else:
            raise HTTPException(status_code=400, detail="Course data is required")

        # Validate using Pydantic
        course_validated = CourseCreateRequest(**course_dict)

        with Session() as session:
            # Check for duplicate course name
            existing = session.query(Course).filter_by(courseName=course_validated.courseName).first()
            if existing:
                raise HTTPException(status_code=400, detail="Course with this name already exists")

            # Validate end date is after start date
            start_date = datetime.strptime(course_validated.startDate, "%Y-%m-%d").date()
            end_date = datetime.strptime(course_validated.endDate, "%Y-%m-%d").date()
            if end_date <= start_date:
                raise HTTPException(status_code=400, detail="End date must be after start date")

            # Validate end time is after start time
            start_time = datetime.strptime(course_validated.startTime, "%H:%M:%S").time()
            end_time = datetime.strptime(course_validated.endTime, "%H:%M:%S").time()
            if end_time <= start_time:
                raise HTTPException(status_code=400, detail="End time must be after start time")

            # Create course
            new_course = Course(
                courseName=course_validated.courseName,
                credits=course_validated.credits,
                startDate=start_date,
                endDate=end_date,
                daysOfWeek=course_validated.daysOfWeek,
                startTime=start_time,
                endTime=end_time
            )

            # Handle file upload
            if file and file.filename:
                file_path = COURSE_UPLOAD_DIR / f"course_{course_validated.courseName}_{file.filename}"
                with open(file_path, "wb") as f:
                    content = await file.read()
                    f.write(content)

                new_course.filename = file.filename
                new_course.file_path = str(file_path)
                new_course.content_type = file.content_type

            session.add(new_course)
            session.commit()
            session.refresh(new_course)

            return expand_course(new_course)

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/courses/{course_id}")
async def update_course(
        course_id: int,
        course_form: str = Form(None),
        file: UploadFile = File(None),
        user: dict = Depends(require_auth),
        course_data: dict = Body(None)
):
    """Update an existing course"""
    try:
        with Session() as session:
            course = session.query(Course).filter_by(id=course_id).first()
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")

            # Handle both form data and JSON body
            if course_form:
                course_dict = json.loads(course_form)
            elif course_data:
                course_dict = course_data
            else:
                course_dict = {}

            # Validate using Pydantic (only provided fields)
            course_update = CourseUpdateRequest(**course_dict)

            # Update fields if provided
            if course_update.courseName is not None:
                course.courseName = course_update.courseName
            if course_update.credits is not None:
                course.credits = course_update.credits
            if course_update.startDate is not None:
                course.startDate = datetime.strptime(course_update.startDate, "%Y-%m-%d").date()
            if course_update.endDate is not None:
                course.endDate = datetime.strptime(course_update.endDate, "%Y-%m-%d").date()
            if course_update.daysOfWeek is not None:
                course.daysOfWeek = course_update.daysOfWeek
            if course_update.startTime is not None:
                course.startTime = datetime.strptime(course_update.startTime, "%H:%M:%S").time()
            if course_update.endTime is not None:
                course.endTime = datetime.strptime(course_update.endTime, "%H:%M:%S").time()

            # Handle file upload
            if file and file.filename:
                file_path = COURSE_UPLOAD_DIR / f"course_{course.courseName}_{file.filename}"
                with open(file_path, "wb") as f:
                    content = await file.read()
                    f.write(content)

                course.filename = file.filename
                course.file_path = str(file_path)
                course.content_type = file.content_type

            session.commit()
            session.refresh(course)

            return expand_course(course)

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/courses/{course_id}")
async def delete_course(course_id: int, user: dict = Depends(require_auth)):
    """Delete a course"""
    with Session() as session:
        course = session.query(Course).filter_by(id=course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Delete associated file if exists
        if course.file_path and os.path.exists(course.file_path):
            os.remove(course.file_path)

        session.delete(course)
        session.commit()

        return {"message": "Course deleted successfully", "id": course_id}


@router.get("/view-course/{course_id}")
async def view_course_file(course_id: int):
    """View/download course syllabus file"""
    with Session() as session:
        course = session.query(Course).filter_by(id=course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if not course.file_path or not os.path.exists(course.file_path):
            raise HTTPException(status_code=404, detail="No file attached to this course")

        return FileResponse(
            course.file_path,
            media_type=course.content_type or "application/pdf",
            headers={"Content-Disposition": f"inline; filename=\"{course.filename}\""}
        )


@router.get("/course-files")
async def get_course_files(user: dict = Depends(require_auth)):
    """Get list of courses with file info"""
    with Session() as session:
        courses = session.query(Course).all()
        return [
            {
                "id": course.id,
                "courseName": course.courseName,
                "has_file": course.filename is not None,
                "filename": course.filename,
                "file_path": course.file_path
            }
            for course in courses
        ]