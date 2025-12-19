from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from database.db import Session
from schemas.student_model import Student
from schemas.student_course_model import StudentCourse
from schemas.user_model import User
from schemas.course_model import Course
from middlewares.auth_middleware import require_auth, require_admin

router = APIRouter(prefix="/api", tags=["students"])


# pydantic models for validation
class StudentCreateRequest(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=255, description="First name")
    lastName: str = Field(..., min_length=1, max_length=255, description="Last name")
    userId: int = Field(..., gt=0, description="User ID to link student to")

    @field_validator('firstName', 'lastName')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class StudentUpdateRequest(BaseModel):
    firstName: Optional[str] = Field(None, min_length=1, max_length=255)
    lastName: Optional[str] = Field(None, min_length=1, max_length=255)

    @field_validator('firstName', 'lastName')
    @classmethod
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v


class EnrollmentRequest(BaseModel):
    courseId: int = Field(..., gt=0, description="Course ID to enroll in")


@router.get("/students")
async def get_students(user: dict = Depends(require_auth)):
    """Get all students"""
    with Session() as session:
        students = session.query(Student).all()
        return [s.to_dictionary() for s in students]


@router.get("/students/{student_id}")
async def get_student(student_id: int, user: dict = Depends(require_auth)):
    """Get a single student by ID"""
    with Session() as session:
        student = session.query(Student).filter_by(id=student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Get enrolled courses
        enrollments = session.query(StudentCourse).filter_by(studentId=student_id).all()
        course_ids = [e.courseId for e in enrollments]
        courses = session.query(Course).filter(Course.id.in_(course_ids)).all() if course_ids else []

        result = student.to_dictionary()
        result["courses"] = [{"id": c.id, "courseName": c.courseName} for c in courses]

        return result


@router.post("/students")
async def create_student(
        request: StudentCreateRequest,
        user: dict = Depends(require_admin)
):
    """Create a new student (admin only)"""
    with Session() as session:
        # Check if user exists
        target_user = session.query(User).filter_by(id=request.userId).first()
        if not target_user:
            raise HTTPException(status_code=400, detail="User not found")

        # Check if user already has a student record
        existing_student = session.query(Student).filter_by(userId=request.userId).first()
        if existing_student:
            raise HTTPException(status_code=400, detail="User already has a student record")

        # Create student
        new_student = Student(
            firstName=request.firstName,
            lastName=request.lastName,
            userId=request.userId
        )

        session.add(new_student)
        session.commit()
        session.refresh(new_student)

        return new_student.to_dictionary()


@router.patch("/students/{student_id}")
async def update_student(
        student_id: int,
        update: StudentUpdateRequest,
        user: dict = Depends(require_admin)
):
    """Update a student (admin only)"""
    with Session() as session:
        student = session.query(Student).filter_by(id=student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        if update.firstName is not None:
            student.firstName = update.firstName
        if update.lastName is not None:
            student.lastName = update.lastName

        session.commit()
        session.refresh(student)

        return student.to_dictionary()


@router.delete("/students/{student_id}")
async def delete_student(
        student_id: int,
        user: dict = Depends(require_admin)
):
    """Delete a student (admin only)"""
    with Session() as session:
        student = session.query(Student).filter_by(id=student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Delete enrollments first
        session.query(StudentCourse).filter_by(studentId=student_id).delete()

        # Delete student
        session.delete(student)
        session.commit()

        return {"message": "Student deleted successfully", "id": student_id}



@router.get("/students/{student_id}/courses")
async def get_student_courses(student_id: int, user: dict = Depends(require_auth)):
    """Get all courses a student is enrolled in"""
    with Session() as session:
        student = session.query(Student).filter_by(id=student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        enrollments = session.query(StudentCourse).filter_by(studentId=student_id).all()
        course_ids = [e.courseId for e in enrollments]
        courses = session.query(Course).filter(Course.id.in_(course_ids)).all() if course_ids else []

        return [{
            "id": c.id,
            "courseName": c.courseName,
            "credits": c.credits,
            "startDate": c.startDate.isoformat() if c.startDate else None,
            "endDate": c.endDate.isoformat() if c.endDate else None,
            "daysOfWeek": c.daysOfWeek
        } for c in courses]


@router.post("/students/{student_id}/enroll")
async def enroll_student(
        student_id: int,
        request: EnrollmentRequest,
        user: dict = Depends(require_auth)
):
    """Enroll a student in a course"""
    with Session() as session:
        # Check if student exists
        student = session.query(Student).filter_by(id=student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check if course exists
        course = session.query(Course).filter_by(id=request.courseId).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check if already enrolled
        existing = session.query(StudentCourse).filter_by(
            studentId=student_id,
            courseId=request.courseId
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already enrolled in this course")

        # Create enrollment
        enrollment = StudentCourse(
            studentId=student_id,
            courseId=request.courseId
        )

        session.add(enrollment)
        session.commit()

        return {
            "message": f"Successfully enrolled in {course.courseName}",
            "studentId": student_id,
            "courseId": request.courseId
        }


@router.delete("/students/{student_id}/courses/{course_id}")
async def unenroll_student(
        student_id: int,
        course_id: int,
        user: dict = Depends(require_auth)
):
    """Remove a student from a course"""
    with Session() as session:
        enrollment = session.query(StudentCourse).filter_by(
            studentId=student_id,
            courseId=course_id
        ).first()

        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")

        session.delete(enrollment)
        session.commit()

        return {
            "message": "Successfully unenrolled from course",
            "studentId": student_id,
            "courseId": course_id
        }



@router.get("/my-enrollments")
async def get_my_enrollments(user: dict = Depends(require_auth)):
    """Get current user's enrolled courses"""
    with Session() as session:
        # Find student record for this user
        student = session.query(Student).filter_by(userId=user['id']).first()
        if not student:
            return []  # No student record means no enrollments

        # Get enrolled course IDs
        enrollments = session.query(StudentCourse).filter_by(studentId=student.id).all()
        course_ids = [e.courseId for e in enrollments]

        return course_ids


@router.post("/enroll/{course_id}")
async def enroll_current_user(
        course_id: int,
        user: dict = Depends(require_auth)
):
    """Enroll current user in a course (auto-creates student record if needed)"""
    with Session() as session:
        # Check if course exists
        course = session.query(Course).filter_by(id=course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Find or create student record for this user
        student = session.query(Student).filter_by(userId=user['id']).first()
        if not student:
            # Get user info to create student
            db_user = session.query(User).filter_by(id=user['id']).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            student = Student(
                firstName=db_user.firstName,
                lastName=db_user.lastName,
                userId=user['id']
            )
            session.add(student)
            session.flush()  # Get the ID without committing

        # Check if already enrolled
        existing = session.query(StudentCourse).filter_by(
            studentId=student.id,
            courseId=course_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already enrolled in this course")

        # Create enrollment
        enrollment = StudentCourse(
            studentId=student.id,
            courseId=course_id
        )
        session.add(enrollment)
        session.commit()

        return {
            "message": f"Successfully enrolled in {course.courseName}",
            "courseId": course_id
        }


@router.delete("/enroll/{course_id}")
async def unenroll_current_user(
        course_id: int,
        user: dict = Depends(require_auth)
):
    """Unenroll current user from a course"""
    with Session() as session:
        # Find student record for this user
        student = session.query(Student).filter_by(userId=user['id']).first()
        if not student:
            raise HTTPException(status_code=404, detail="Not enrolled in any courses")

        # Find enrollment
        enrollment = session.query(StudentCourse).filter_by(
            studentId=student.id,
            courseId=course_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=404, detail="Not enrolled in this course")

        session.delete(enrollment)
        session.commit()

        return {
            "message": "Successfully unenrolled from course",
            "courseId": course_id
        }