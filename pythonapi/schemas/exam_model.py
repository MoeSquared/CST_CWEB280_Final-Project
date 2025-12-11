from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship

from database.db import Base

class Exam(Base):
    """
    Exam/Quiz table
    """
    __tablename__ = "exam_o"


    id = Column(Integer, primary_key=True) # examID
    title = Column(String, nullable=False)
    dateOf = Column(Date, nullable=False)
    weight = Column(Float, nullable=False)
    courseId = Column(Integer, ForeignKey("course.id"), nullable=False)

    # Relationship to Course
    course = relationship("Course", back_populates="exams")