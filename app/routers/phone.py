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
import os
import glob
import sys

if sys.platform == "win32":
    import win32gui
    import win32con
    import win32api
    import win32process


# Stelle sicher, dass du ein Verzeichnis für Templates hast, z. B., "templates"
templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix= "/phones", tags=["Phones"])


# Lösche ein Phone    
@router.delete("/{phone_id}")
async def delete_project(phone_id: int, db: Session = Depends(get_db)):
    # Suchen des Projekts in der Datenbank
    phone = db.query(models.Phone).filter(models.Phone.id == phone_id).first()

    # Wenn das Projekt nicht existiert, eine 404 Fehler auslösen
    if not phone:
        raise HTTPException(status_code=404, detail="Telefon nicht gefunden")
    
    # Löschen des Telefons
    db.delete(phone)
    db.commit()

    return {"detail": "Telefon erfolgreich gelöscht"}

# Create new Phone
@router.post("/create")
def create_phone(phone: schemas.PhoneCreate, db: Session = Depends(get_db)):
    db_phone = models.Phone(**phone.dict())
    db.add(db_phone)
    db.commit()
    db.refresh(db_phone)
    return {"message": "Phone created successfully", "phone": db_phone}

@router.post("/update-phone")
def update_phone(request: schemas.UpdatePhoneRequest, db: Session = Depends(get_db)):
    try:
        # Finde das Telefon anhand der ID
        phone = db.query(models.Phone).filter(models.Phone.id == request.id).first()
        
        if not phone:
            raise HTTPException(status_code=404, detail="Telefon nicht gefunden.")
        
        # Prüfe, ob das Feld existiert und aktualisiere es
        if hasattr(phone, request.field):
            setattr(phone, request.field, request.value)
            db.commit()
            return {"message": "Telefon erfolgreich aktualisiert."}
        else:
            raise HTTPException(status_code=400, detail="Ungültiges Feld.")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
