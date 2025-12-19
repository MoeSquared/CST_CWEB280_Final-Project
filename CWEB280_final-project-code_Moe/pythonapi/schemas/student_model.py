from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database.db import Base


class Student(Base):
    """SQLite Student table structure"""
    __tablename__ = "student"

    id = Column(Integer, primary_key=True)
    firstName = Column(String(255), nullable=False)
    lastName = Column(String(255), nullable=False)
    userId = Column(Integer, ForeignKey("user.id"), unique=True, nullable=False)

    # Relationship to User (one-to-one)
    user = relationship("User", back_populates="student")

    # Relationship to Courses (many-to-many via StudentCourse intermediate table)
    courses = relationship("Course", secondary="student_course", back_populates="students")

    def to_dictionary(self):
        """Convert student object to dictionary"""
        return {
            "id": self.id,
            "firstName": self.firstName,
            "lastName": self.lastName,
            "userId": self.userId,
            "name": f"{self.firstName} {self.lastName}"
        }