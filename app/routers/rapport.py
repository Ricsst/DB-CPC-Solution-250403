from fastapi import Response, status, HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db, SessionLocal, engine 
from .. import models, schemas, oauth2
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
import os


# Stelle sicher, dass du ein Verzeichnis für Templates hast, z. B., "templates"
templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix= "/rapports", tags=["Rapports"])


# Create new rapport
@router.post("/create")
def create_rapport(rapport: schemas.RapportCreate, db: Session = Depends(get_db)):
    db_rapport = models.Rapport(**rapport.dict())
    db.add(db_rapport)
    db.commit()
    db.refresh(db_rapport)
    return db_rapport


@router.post("/update-rapport")
def update_rapport(request: schemas.UpdateRapportRequest, db: Session = Depends(get_db)):
    #print(f"Session: {db}")
    #print(f"Request: {request.id}, {request.field}, {request.value}")
    try:
        rapport = db.query(models.Rapport).filter(models.Rapport.id == request.id).first()
        print(f"Found rapport: {rapport.__dict__ if rapport else None}")
        
        if not rapport:
            raise HTTPException(status_code=404, detail="Rapport nicht gefunden.")
        
        if hasattr(rapport, request.field):
            setattr(rapport, request.field, request.value)
            #print(f"Updated rapport: {rapport.__dict__}")
            db.flush()
            db.commit()
            db.refresh(rapport)
            #print(f"After commit: {rapport.__dict__}")
            return {"message": "Rapport erfolgreich aktualisiert.", "rapport": rapport.__dict__}
        else:
            raise HTTPException(status_code=400, detail="Ungültiges Feld.")
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
# Lösche einen Rapport
@router.delete("/{rapport_id}")
async def delete_rapport(rapport_id: int, db: Session = Depends(get_db)):
    # Suchen des Rapports in der Datenbank
    rapport = db.query(models.Rapport).filter(models.Rapport.id == rapport_id).first()

    # Wenn der Rapport nicht existiert, eine 404 Fehler auslösen
    if not rapport:
        raise HTTPException(status_code=404, detail="Rapport nicht gefunden")
    
    # Löschen des Rapports
    db.delete(rapport)
    db.commit()

    return {"detail": "Rapport erfolgreich gelöscht"}

