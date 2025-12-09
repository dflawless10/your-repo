# BidGoatMobile/models.py
from sqlalchemy import Column, Integer, String
from BidGoatMobile.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
