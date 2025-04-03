from typing import Optional, Union
from pydantic import BaseModel, EmailStr
from datetime import datetime

#User -User
class UserCreate(BaseModel):
    email: str
    username: str
    first_name: str
    last_name: str
    password: str
    role: str
    created_at: Optional[datetime] = None  # Optional machen
    class Config:
        orm_mode = True

class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

#Config
class Config:
    from_attributes = True

#Token - Token
class Token(BaseModel):
    access_token: str
    token_type: str

# Project
class TokenData(BaseModel):
    id: Union[str, int] = None

class ProjectCreate(BaseModel):
    title: str
    description: str
    location: str

class UpdateProjectRequest(BaseModel):
    id: int
    field: str
    value: str


class Project(BaseModel):
    nr: str
    title: str
    location: str


 #Todo -Todo
class TodoCreate(BaseModel):
    project_id: int
    todo: str
    week: int
    created_at: datetime

class TodoUpdate(BaseModel):
    week: int
    todo: str

class Todo(BaseModel):
    id: int
    todo: str
    week: int
    project_id: int

class UpdateTodoRequest(BaseModel):
    id: int
    field: str
    value: str


# Update Todos um eine Woche
class UpdateWeekRequest(BaseModel):
    week: int


# Phone
class PhoneCreate(BaseModel):
    name: str
    beschreibung: str
    number: str

class UpdatePhoneRequest(BaseModel):
    id: int
    field: str
    value: str


# Rapport
class RapportCreate(BaseModel):
    project: str
    date: datetime

class RapportResponse(BaseModel):
    message: str
    rapport_id: int

class UpdateRapport(BaseModel):
    project: Optional[str] = None
    done: Optional[bool] = None
    priority: Optional[str] = None
    plan: Optional[str] = None
    effektiv: Optional[str] = None
    bemerkung: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None

class UpdateRapportRequest(BaseModel):
    id: int
    field: str
    value: str

#Note
class NoteUpdate(BaseModel):
    part: Optional[str] = None
    note: Optional[str] = None
    title: Optional[str] = None
    kind: Optional[str] = None
    sessionlocation: Optional[str] = None
    created_at: Optional[datetime] = None  # Optional für Teilupdates

    class Config:
        orm_mode = True  # Falls du SQLAlchemy-Modelle verwendest

#Attachment
class AttachInput(BaseModel):
    todo_id: int
    attachment: Optional[str] = None  # Optionales Feld
    #file_path: str  # Pfad zur Datei, nicht die Datei selbst
    class Config:
        orm_mode = True


class UpdateAttachmentRequest(BaseModel):
    id: int
    field: str
    value: str

class UpdateInput(BaseModel):
    id: int
    field: str
    value: str

# Für Pfad des Anhangs
class UserRequest(BaseModel):
    user: str




    






