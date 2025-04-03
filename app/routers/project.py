from fastapi import Response, status, HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db 
from .. import models, schemas, oauth2
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles 
from fastapi.templating import Jinja2Templates
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

import os
import glob
import sys
import subprocess

if sys.platform == "win32":
    import win32gui
    import win32con
    import win32api
    import win32process


# Stelle sicher, dass du ein Verzeichnis für Templates hast, z. B., "templates"
templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix= "/projects", tags=["Projects"])

# öffnete das Formular projects; beim öffnen wird zuerst der Token geprüft über JS im html und danach die Daten abgerufen
@router.get("/", response_class=HTMLResponse)
def get_project(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse("projects.html", {"request": request})

# Abruf der Daten für projects.html; alle Daten
@router.get("/projects", response_class=JSONResponse)
def get_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),  # Authentifizierung erforderlich
):
    # Abfrage der Datenbank
    projects = db.query(models.Project).all()
    todos = db.query(models.Todo).all()
    rapports = db.query(models.Rapport).all()
    phones = db.query(models.Phone).all()
    attachments = db.query(models.Attachment).all()

    # Konvertierung der SQLAlchemy-Objekte in JSON-kompatible Formate
    projects_data = jsonable_encoder(projects)
    todos_data = jsonable_encoder(todos)
    rapports_data = jsonable_encoder(rapports)
    phones_data = jsonable_encoder(phones)
    attachments_data = jsonable_encoder(attachments)

    # Erstellung der Antwortdaten
    response_data = {
        "projects": projects_data,
        "todos": todos_data,
        "rapports": rapports_data,
        "phones": phones_data,
        "attachments": attachments_data,
    }

    return JSONResponse(content=response_data)

# Abruf der Daten für Projekte
@router.get("/get-projects", response_class=JSONResponse)
def get_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    projects = db.query(models.Project).all()
    return jsonable_encoder(projects)  # <-- Kein {"projects": ...}

# Create new project
@router.post("/create")
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return {"message": "Project created successfully", "project_id": db_project.id}


# Windows- oder Linux-kompatibler Pfad (Anpassen falls nötig)
BASE_PATH = r"V:/1.1 Aufträge aktiv" if sys.platform == "win32" else "/mnt/data/1.1_Auftraege_aktiv"
# Öffne den Explorer über die Auftragsnummer
@router.get("/open-file/{project_nr}")
def open_file(project_nr: str):
    """Öffnet eine Datei mit dem Standard-Dateimanager auf Windows oder Linux."""
    
    # Suche nach der Datei im BASE_PATH, die mit project_nr beginnt
    matching_files = [f for f in os.listdir(BASE_PATH) if f.startswith(project_nr)]
    
    if not matching_files:
        raise HTTPException(status_code=404, detail="No matching files found")
    
    file_path = os.path.join(BASE_PATH, matching_files[0])
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        if sys.platform == "win32":
            os.startfile(file_path)  # Windows: Standard-Programm öffnen
        elif sys.platform == "darwin":  # macOS
            subprocess.run(["open", file_path], check=True)
        elif sys.platform.startswith("linux"):
            subprocess.run(["xdg-open", file_path], check=True)  # Linux: Standard-App öffnen
        else:
            raise HTTPException(status_code=500, detail="Unsupported OS")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opening file: {str(e)}")

    return {"message": f"Opened {file_path}"}

#Projekt aktualisieren bei Änderung
@router.post("/update-project")
def update_project(request: schemas.UpdateProjectRequest, db: Session = Depends(get_db)):
    try:
        # Finde das Projekt anhand der ID
        project = db.query(models.Project).filter(models.Project.id == request.id).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Projekt nicht gefunden.")
        
        # Prüfe, ob das Feld existiert und aktualisiere es
        if hasattr(project, request.field):
            setattr(project, request.field, request.value)
            db.commit()
            return {"message": "Projekt erfolgreich aktualisiert."}
        else:
            raise HTTPException(status_code=400, detail="Ungültiges Feld.")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Lösche ein Projekt    
@router.delete("/{project_id}")
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    # Suchen des Projekts in der Datenbank
    project = db.query(models.Project).filter(models.Project.id == project_id).first()

    # Wenn das Projekt nicht existiert, eine 404 Fehler auslösen
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Löschen des Projekts
    db.delete(project)
    db.commit()

    return {"detail": "Projekt erfolgreich gelöscht"}
