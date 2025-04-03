from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text 
from sqlalchemy.sql.sqltypes import TIMESTAMP
from .database import Base, engine
from pydantic_settings import BaseSettings
from pydantic import BaseModel


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(String, nullable=False, unique=True)
    username = Column(String, unique=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    password = Column(String, nullable=False)  # Korrekte Schreibweise
    is_active = Column(Boolean, default=True)
    role = Column (String)
    # mobile_num = Column(Integer, nullable=False, unique=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=True)

    part = Column(String, nullable=True)
    note=Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    sessionlocation = Column(String, nullable=True)
    kind = Column(String, nullable=True)

    project = relationship("Project", back_populates="notes")

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    todo = Column(String, nullable=False)
    week = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    # Beziehung zur Project-Tabelle
    project = relationship("Project", back_populates="todos")

    # Beziehung zur Attach-Tabelle
    attachs = relationship("Attachment", back_populates="todo", cascade="all, delete-orphan")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, nullable=False)
    todo_id = Column(Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=False)
    attachment = Column(String, nullable=True)
  
        # Beziehung zur Todo-Tabelle
    todo = relationship("Todo", back_populates="attachs")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nr = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    location = Column(String, nullable=False)
    leader = Column(String, nullable=True)
    active = Column(Boolean, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    notes = relationship("Note", back_populates="project", cascade="all, delete-orphan")
    todos = relationship("Todo", back_populates="project", cascade="all, delete-orphan")
  
class Phone(Base):
    __tablename__ = "telefons"
    id = Column(Integer, primary_key=True, nullable=False)
    name= Column(String, nullable=True)
    beschreibung = Column(String, nullable=True)
    number = Column(String, nullable=True)
    

class Rapport(Base):
    __tablename__ = "rapports"
    id = Column(Integer, primary_key=True, nullable=False)
    project = Column(String, nullable=False)
    done = Column(Boolean, nullable=True)
    priority = Column(Boolean, nullable=True)
    plan= Column(Integer, nullable=True)
    effektiv= Column(Integer, nullable=True)
    bemerkung= Column(String, nullable=True)
    date = Column(TIMESTAMP(timezone=True), nullable=False)
    description = Column(String, nullable=True)
   


 

