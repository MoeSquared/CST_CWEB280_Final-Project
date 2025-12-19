# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from services.config import SQL_CONNECTION_STRING

# Create engine with echo for debugging (set to False in production)
engine = create_engine(SQL_CONNECTION_STRING, echo=False)

# Create session
Session = sessionmaker(bind=engine, expire_on_commit=False)

# Create base class for declarative models
Base = declarative_base()