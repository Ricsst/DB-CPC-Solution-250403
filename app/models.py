from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text 
from sqlalchemy.sql.sqltypes import TIMESTAMP
from .database import Base, engine
from pydantic_settings import BaseSettings
from pydantic import BaseModel

class Projekt(Base):
    __tablename__ = "projekt"

    id_proj = Column(Integer, primary_key=True, autoincrement=True)
    number_proj = Column(String, nullable=True)
    date_proj = Column(DateTime, nullable=True)
    description_proj = Column(String, nullable=True)
    place_proj = Column(String, nullable=True)
    customer_id = Column(Integer, nullable=True)
    status_id = Column(Integer, nullable=True)
    typ_proj_id = Column(Integer, nullable=True)
    delivery_name = Column(String, nullable=True)
    delivery_street = Column(String, nullable=True)
    delivery_zip = Column(String, nullable=True)
    delivery_place = Column(String, nullable=True)
    notizprojekt = Column(Text, nullable=True)

class Customer(Base):
    __tablename__ = "customer"

    id_customer = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True)
    firstname = Column(String, nullable=True)
    familyname = Column(String, nullable=True)
    position = Column(String, nullable=True)
    telefonnumer = Column(String, nullable=True)
    handy = Column(String, nullable=True)
    email = Column(String, nullable=True)
    bemerkung = Column(Text, nullable=True)    

class Bill(Base):
    __tablename__ = "bill"

    id_bill = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, nullable=True)
    number_bill = Column(String, nullable=True)
    description_bill = Column(String, nullable=True)
    date_bill = Column(DateTime, nullable=True)
    link_bill = Column(String, nullable=True)  # Link als String gespeichert
    amount_bill = Column(Float, nullable=True)  # Betrag als Float für Dezimalwerte
    faelligkeitsdatum = Column(DateTime, nullable=True)
    eingangsdatum = Column(DateTime, nullable=True)

class Company(Base):
    __tablename__ = "company"

    id_company = Column(Integer, primary_key=True, autoincrement=True)
    companyname = Column(String, nullable=True)
    zusatzcompanyname = Column(String, nullable=True)
    com_telefonnumber = Column(String, nullable=True)
    com_email = Column(String, nullable=True)
    street = Column(String, nullable=True)
    streetnumber = Column(String, nullable=True)
    zip = Column(String, nullable=True)
    place_customer = Column(String, nullable=True)
    firmennotiz = Column(Text, nullable=True)

class Activity(Base):
    __tablename__ = "activities"

    id_activities = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True)
    date_activity = Column(DateTime, nullable=True)
    responsible = Column(String, nullable=True)
    status_activity = Column(String, nullable=True)
    description_activity = Column(Text, nullable=True)
    customer_id = Column(Integer, nullable=True)

class Customer(Base):
    __tablename__ = "customers"

    id_customer = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String(255), nullable=True)
    firstname = Column(String(255), nullable=True)
    familyname = Column(String(255), nullable=True)
    position = Column(String(255), nullable=True)
    telephonnumber = Column(String(50), nullable=True)
    handy = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    bemerkung = Column(Text, nullable=True)

# Alte models **************************************************************************************************

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
   


 

