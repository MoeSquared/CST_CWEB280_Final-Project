from sqlalchemy.orm import relationship

from sqlalchemy import Column, Integer, String, Date, Time

from database.db import Base


class Course(Base):
    """SQLite Course table structure"""
    __tablename__ = "course"

    id = Column(Integer, primary_key=True)
    courseName = Column(String, unique=True, nullable=False)
    credits = Column(Integer, nullable=False)
    startDate = Column(Date, nullable=False)
    endDate = Column(Date, nullable=False)
    daysOfWeek = Column(String, nullable=False)
    startTime = Column(Time, nullable=False)
    endTime = Column(Time, nullable=False)

    filename = Column(String(255))
    file_path = Column(String(500))
    content_type = Column(String(100))

    # relationships
    assignments = relationship("Assignment", back_populates="course")
    exams = relationship("Exam", back_populates="course")

    # many-to-many relationship with students via intermediate table
    students = relationship("Student", secondary="student_course", back_populates="courses")