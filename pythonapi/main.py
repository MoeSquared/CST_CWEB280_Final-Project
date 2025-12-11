import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine

from database.db import Base
from services.config import SQL_CONNECTION_STRING

from schemas.user_model import User
from schemas.student_model import Student
from schemas.student_course_model import StudentCourse
from schemas.course_model import Course
from schemas.assignment_model import Assignment
from schemas.exam_model import Exam

from endpoints import event_endpoint, course_endpoint, assignment_endpoint, user_endpoint, exam_endpoint, student_endpoint
from database.seed_data import init_seed_data


def init_database():
    print("Starting database initialization...")

    # Create engine and tables
    engine = create_engine(SQL_CONNECTION_STRING)
    Base.metadata.create_all(bind=engine)
    print(f"Database created: {SQL_CONNECTION_STRING}")

    # Initialize default users (admin and test users)
    user_endpoint.init_default_users()
    print("Default users initialized")
    init_seed_data()


# Initialize database before creating the FastAPI app
init_database()

# Create FastAPI app
app = FastAPI()

# CORS configuration
origins = ["http://localhost:5173", "http://localhost:54742"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Course Tracker API"}

# Adding routers
app.include_router(event_endpoint.router)
app.include_router(assignment_endpoint.router)
app.include_router(course_endpoint.router)
app.include_router(user_endpoint.router)
app.include_router(exam_endpoint.router)
app.include_router(student_endpoint.router)


if __name__ == "__main__":
    print("Server is starting on \033[96m http://localhost:8080 \033[0m")
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)