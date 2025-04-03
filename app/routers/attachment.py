from fastapi import Response, status, HTTPException, Depends, APIRouter
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db 
from .. import models, schemas, oauth2
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from base64 import b64decode

from fastapi.templating import Jinja2Templates
from fastapi import Request
import logging
import os
import getpass
from pathlib import Path
import subprocess


# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)



# Stelle sicher, dass du ein Verzeichnis für Templates hast, z. B., "templates"
templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix= "/attachments", tags=["Attachments"])


@router.get("/attachments", response_class=JSONResponse)
def get_attachments(db: Session = Depends(get_db)):
    attachments = db.query(models.Attachment).all()
    return JSONResponse(content=jsonable_encoder(attachments))


@router.post("/create")
def create_attachment(data: schemas.AttachInput, db: Session = Depends(get_db)):
    try:
        print("📥 Empfangene Daten:", data.dict())  # Debugging-Ausgabe

        # Prüfe, ob todo_id existiert
        todo = db.query(models.Todo).filter(models.Todo.id == data.todo_id).first()
        if not todo:
            raise HTTPException(status_code=404, detail="Todo nicht gefunden")

        new_attach = models.Attachment(
            todo_id=data.todo_id,
            attachment=data.attachment  # Kann None sein
        )

        db.add(new_attach)
        db.commit()
        db.refresh(new_attach)

        return new_attach

    except Exception as e:
        import traceback
        print("🔥 FEHLER:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Fehler: {str(e)}")
    

@router.post("/update")  # Pfad angepasst an Frontend
def update_attachment(data: schemas.UpdateInput, db: Session = Depends(get_db)):
    # Attachment aus der Datenbank abrufen
    attachment = db.query(models.Attachment).filter(models.Attachment.id == data.id).first()
    
    # Prüfen, ob das Attachment existiert
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment nicht gefunden")
    
    # Feld dynamisch aktualisieren
    setattr(attachment, data.field, data.value)
    
    # Änderungen in der Datenbank speichern
    db.commit()
    
    # Optional: Objekt aktualisieren, um die neuesten Daten zurückzugeben
    db.refresh(attachment)
    
    return {"message": "Attachment erfolgreich aktualisiert", "attachment": attachment.__dict__}


@router.delete("/{attachment_id}")
async def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    # Suchen des Attachments in der Datenbank
    attachment = db.query(models.Attachment).filter(models.Attachment.id == attachment_id).first()

    # Wenn das Attachment nicht existiert, eine 404-Fehlermeldung zurückgeben
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment nicht gefunden")
    
    # Löschen des Attachments
    db.delete(attachment)
    db.commit()

    return {"detail": "Attachment erfolgreich gelöscht"}

# Öffne eine Datei im Datei-Explorer

# Ursprünglicher Basis-Pfad (ersetze ihn mit deinem eigenen)

#BASE_PFAD_TEMPLATE = r"C:/Users/{user}/OneDrive - Staubli Kurath und Partner AG/DBProjektsteuerung/Pendenzen/"
#windows_user = getpass.getuser()  # Aktuellen Windows-Benutzer abrufen

# Setze den finalen BASE_PFAD
#BASE_PFAD = BASE_PFAD_TEMPLATE.format(user=windows_user)
#print(f"📁 Neuer BASE_PFAD: {BASE_PFAD}")  # Debugging-Ausgabe

@router.get("/open-file/{attachmentID}")
def open_file(attachmentID: int, db: Session = Depends(get_db)):

    windows_user = getpass.getuser()
    print(f"👤 Aktueller Windows-Benutzer: {windows_user}")

    attachment = db.query(models.Attachment).filter(models.Attachment.id == attachmentID).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Anhang nicht gefunden")

    original_path = attachment.attachment
    print(f"📄 Original-Pfad aus DB: {original_path}")

    parts = original_path.split("\\")
    if len(parts) >= 3 and parts[1].lower() == "users":
        parts[2] = windows_user
        new_path = "\\".join(parts)
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Pfad: Benutzerordner nicht erkannt")

    print(f"📂 Ersetzter Pfad: {new_path}")

    if not os.path.exists(new_path):
        raise HTTPException(status_code=404, detail=f"Datei existiert nicht: {new_path}")

    # Statt os.startfile → subprocess mit sichtbarem Start
    if os.name == "nt":
        try:
            subprocess.Popen(["cmd", "/c", "start", "", new_path], shell=True)
            #subprocess.Popen(["cmd", "/c", "start", "outlook"], shell=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fehler beim Öffnen der Datei: {str(e)}")
    else:
        raise HTTPException(status_code=500, detail="Nicht unterstütztes Betriebssystem")

    return {
        "message": f"Datei geöffnet: {new_path}",
        "file_path": new_path,
        "windows_user": windows_user
    }

@router.post('/replace_names')
def replace_names(request: schemas.UserRequest, db: Session = Depends(get_db)):
    user = request.user
    print(f"replace name für user: {user}")
    
    try:
        attachments = db.query(models.Attachment).all()
        print(f"Gefundene Anhänge: {len(attachments)}")

        changes = 0
        for attach in attachments:
            if attach.attachment:
                parts = attach.attachment.split('\\')
                if len(parts) > 2:
                    parts[2] = user
                    attach.attachment = '\\'.join(parts)
                    db.add(attach)
                    changes += 1

        db.commit()
        print(f"{changes} Attachments wurden geändert")

        print("DB erfolgreich aktualisiert")
        return JSONResponse(content={'status': 'success'})
    
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})

    finally:
        db.close()