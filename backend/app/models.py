from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), default="")
    due_date = Column(DateTime, nullable=True)
    priority = Column(Integer, default=5)
    status = Column(String(50), default="Pending")
    parent_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    duration = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow)