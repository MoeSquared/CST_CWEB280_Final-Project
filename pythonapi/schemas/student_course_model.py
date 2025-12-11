from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime

from database.db import Base


class StudentCourse(Base):
    """
    intermediate table for Student-Course many-to-many relationship
    """
    __tablename__ = "student_course"

    id = Column(Integer, primary_key=True)
    studentId = Column(Integer, ForeignKey("student.id"), nullable=False)
    courseId = Column(Integer, ForeignKey("course.id"), nullable=False)
    enrolledAt = Column(DateTime, default=datetime.now())

    def to_dictionary(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "studentId": self.studentId,
            "courseId": self.courseId,
            "enrolledAt": self.enrolledAt.isoformat() if self.enrolledAt else None
        }