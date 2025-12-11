from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from database.db import Base


class User(Base):
    """SQLite User table structure"""
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    firstName = Column(String(255), nullable=False)
    lastName = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=True)  # Nullable for Google users
    role = Column(String(50), default="user", nullable=False)  # 'admin' or 'user'
    is_google_user = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    student = relationship("Student", back_populates="user", uselist=False)

    def to_dictionary(self):
        """Convert user object to dictionary (excluding password)"""
        return {
            "id": self.id,
            "firstName": self.firstName,
            "lastName": self.lastName,
            "name": f"{self.firstName} {self.lastName}",
            "email": self.email,
            "role": self.role,
            "is_google_user": self.is_google_user,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }