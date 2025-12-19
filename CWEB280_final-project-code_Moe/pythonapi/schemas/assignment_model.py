from sqlalchemy import Column, Integer, String, Date, Time, Float, ForeignKey
from sqlalchemy.orm import relationship

from database.db import Base


class Assignment(Base):
    """SQLite Assignment table structure"""
    __tablename__ = "assignment"
    id = Column(Integer, primary_key=True)
    assignmentTitle = Column(String, unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    courseId = Column(Integer, ForeignKey("course.id"), nullable=False)
    dueDate = Column(Date, nullable=False)
    dueTime = Column(Time, nullable=False)
    worth = Column(Float, nullable=True)

    filename = Column(String(255))
    file_path = Column(String(500))
    content_type = Column(String(100))

    course = relationship("Course", back_populates="assignments")