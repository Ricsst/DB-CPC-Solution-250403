from fastapi import Response, status, HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db 
from .. import models, schemas, oauth2
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles 
from fastapi.templating import Jinja2Templates
from fastapi import Request
import logging

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)



# Stelle sicher, dass du ein Verzeichnis für Templates hast, z. B., "templates"
templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix= "/notes", tags=["Notes"])

@router.post("/notes/{project_id}", response_class=HTMLResponse)
def get_or_create_note(project_id: int, request: Request, db: Session = Depends(get_db)):
    # Prüfen, ob eine Note für das Projekt existiert
    note = db.query(models.Note).filter(models.Note.project_id == project_id).order_by(models.Note.id.desc()).first()

    # Wenn keine Notiz gefunden wurde, eine neue erstellen
    if not note:
        new_note = models.Note(
            project_id=project_id,
            part="Default Part",
            note="Default Note"
        )
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        note = new_note

    # Prüfen, ob die aktuelle URL korrekt ist
    if request.url.path != f"/notes/{note.id}":
        # Zur URL der Notiz umleiten
        return RedirectResponse(url=f"/notes/{note.id}")

    # Rückgabe der Note an das Template
    return templates.TemplateResponse("note.html", {"request": request, "note": note})


# Aktualiseren der Notiz

@router.put("/{id}", response_model=dict)
def update_note(id: int, data: schemas.NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == id).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Aktualisiere alle Felder, falls sie im Request enthalten sind
    update_data = data.dict(exclude_unset=True)  # Nur übermittelte Felder aktualisieren
    for key, value in update_data.items():
        setattr(note, key, value)  

    db.commit()
    db.refresh(note)  # Aktualisierte Daten zurückholen

    return JSONResponse(content={"note_id": note.id, "status": "updated", "updated_fields": list(update_data.keys())})



# Erstellen einer neuen Notiz
@router.post("/{id}/create", response_class=HTMLResponse)
def create_note(id: int, request: Request, db: Session = Depends(get_db)):
   # project = db.query(models.Project).filter(models.Project.id == id).first()
   # if not project:
    #    raise HTTPException(status_code=404, detail="Project not found")

    new_note = models.Note(
        project_id=id,
        part="Default Part",
        note="Default Note"
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return JSONResponse(content={"note_id": new_note.id})
    #return templates.TemplateResponse("note.html", {"request": request, "note": new_note})


# Suche die Note basierend auf der Notiz-ID
@router.get("/{note_id}", response_class=HTMLResponse)
def get_note_by_id(note_id: int, request: Request, db: Session = Depends(get_db)):
    
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Rückgabe der Note an das Template
    return templates.TemplateResponse("note.html", {"request": request, "note": note})


# Suche von Notizen basierend auf dem Projekt-ID
@router.get("/projeccct/{project_id}", response_class=HTMLResponse)
def get_note_and_project_notes(project_id: int, request: Request, db: Session = Depends(get_db)):
    # Hole die erste Note für das Projekt
    note = db.query(models.Note).filter(models.Note.project_id == project_id).order_by(models.Note.id.desc()).first()

    if not note:
        # Wenn keine Note existiert, erstelle eine neue Note für das Projekt
        note = models.Note(
            project_id=project_id,
            part="Default Part",
            note="Default Note",
        )
        db.add(note)
        db.commit()
        db.refresh(note)

    # Hole alle Notizen für das Projekt
    project_notes = db.query(models.Note).filter(models.Note.project_id == project_id).order_by(models.Note.created_at.desc()).all()

    # Rückgabe an das Template
    return templates.TemplateResponse("note.html", {
        "request": request,
        "note": note,
        "project_notes": project_notes
    })


# Suche von Notizen basierend auf dem Projekt-ID
@router.get("/project/{project_id}", response_model=dict)
def get_or_create_note(project_id: int, db: Session = Depends(get_db)):
    logging.debug(f"Route /project/{project_id} wurde aufgerufen")
    note = db.query(models.Note).filter(models.Note.project_id == project_id).order_by(models.Note.id.desc()).first()
    
    if note:
        logging.debug(f"Gefundene Note ID: {note.id}")
    else:
        logging.debug("Keine Note gefunden.")
    
    if not note:
        note = models.Note(
            project_id=project_id,
            part="Default Part",
            note="Default Note",
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        logging.debug(f"Neue Note erstellt mit ID: {note.id}")
    
    return {"note_id": note.id}

@router.get("/project/all/{project_id}")
def get_note_and_project_notes(project_id: int, db: Session = Depends(get_db)):
    # Hole alle Notizen für das Projekt
    logging.debug(f"projekt id {project_id}")
    project_notes = db.query(models.Note).filter(models.Note.project_id == project_id).order_by(models.Note.created_at.desc()).all()

    if not project_notes:
        return {"project_notes": []}

    return {"project_notes": [{"id": note.id,"note": note.note, "part": note.part, "title": note.title, "created_at": note.created_at.strftime('%Y-%m-%d')} for note in project_notes]}
