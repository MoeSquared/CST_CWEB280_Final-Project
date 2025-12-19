from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from database.db import Session
from schemas.exam_model import Exam
from schemas.course_model import Course
from utilities.format_exam import format_exam
from middlewares.auth_middleware import require_auth

router = APIRouter(prefix="/api", tags=["exams"])


# Pydantic models for request validation
class ExamCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Exam title")
    dateOf: str = Field(..., description="Exam date in YYYY-MM-DD format")
    weight: float = Field(..., ge=0, le=100, description="Weight as percentage (0-100)")
    courseId: int = Field(..., gt=0, description="Course ID")

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @field_validator('dateOf')
    @classmethod
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError('dateOf must be in YYYY-MM-DD format')
        return v


class ExamUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    dateOf: Optional[str] = None
    weight: Optional[float] = Field(None, ge=0, le=100)
    courseId: Optional[int] = Field(None, gt=0)

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip() if v else v

    @field_validator('dateOf')
    @classmethod
    def validate_date_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError('dateOf must be in YYYY-MM-DD format')
        return v


@router.get("/exams")
async def get_exams(user: dict = Depends(require_auth)):
    """Get all exams from the database"""
    exam_events = []

    with Session() as session:
        exams = session.query(Exam).all()
        for exam in exams:
            exam_events.append(format_exam(exam))

    return exam_events


@router.get("/exams/{exam_id}")
async def get_exam(exam_id: int, user: dict = Depends(require_auth)):
    """Get a single exam by ID"""
    with Session() as session:
        exam = session.query(Exam).filter_by(id=exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")

        return {
            "id": exam.id,
            "title": exam.title,
            "dateOf": exam.dateOf.isoformat() if exam.dateOf else None,
            "weight": exam.weight,
            "courseId": exam.courseId
        }


@router.post("/exams")
async def create_exam(
        exam_data: ExamCreateRequest,
        user: dict = Depends(require_auth)
):
    """Create a new exam"""
    with Session() as session:
        # Verify that the course exists
        course = session.query(Course).filter_by(id=exam_data.courseId).first()
        if not course:
            raise HTTPException(status_code=400, detail="Course not found")

        # Convert string date to Python date object
        exam_date = datetime.strptime(exam_data.dateOf, "%Y-%m-%d").date()

        # Create the exam
        new_exam = Exam(
            title=exam_data.title,
            dateOf=exam_date,
            weight=exam_data.weight,
            courseId=exam_data.courseId
        )

        session.add(new_exam)
        session.commit()
        session.refresh(new_exam)

        return format_exam(new_exam)


@router.patch("/exams/{exam_id}")
async def update_exam(
        exam_id: int,
        exam_update: ExamUpdateRequest,
        user: dict = Depends(require_auth)
):
    """Update an existing exam"""
    with Session() as session:
        exam = session.query(Exam).filter_by(id=exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")

        # Update fields if provided
        if exam_update.title is not None:
            exam.title = exam_update.title
        if exam_update.dateOf is not None:
            exam.dateOf = datetime.strptime(exam_update.dateOf, "%Y-%m-%d").date()
        if exam_update.weight is not None:
            exam.weight = exam_update.weight
        if exam_update.courseId is not None:
            # Verify course exists
            course = session.query(Course).filter_by(id=exam_update.courseId).first()
            if not course:
                raise HTTPException(status_code=400, detail="Course not found")
            exam.courseId = exam_update.courseId

        session.commit()
        session.refresh(exam)

        return format_exam(exam)


@router.delete("/exams/{exam_id}")
async def delete_exam(
        exam_id: int,
        user: dict = Depends(require_auth)
):
    """Delete an exam"""
    with Session() as session:
        exam = session.query(Exam).filter_by(id=exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")

        session.delete(exam)
        session.commit()

        return {"message": "Exam deleted successfully", "id": exam_id}