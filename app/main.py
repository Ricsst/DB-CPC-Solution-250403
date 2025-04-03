import os
import getpass
from pydantic import BaseModel
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.routers import attachment
from .routers import user, auth, project,  todo, rapport, note, attachment, phone
from fastapi.middleware.cors import CORSMiddleware
#from models import Base  # Stelle sicher, dass Base in models.py definiert ist
#from database import engine  # Stelle sicher, dass engine mit der Render-DB verbunden ist
from .database import Base, engine

# venv/scripts/activate
# $env:ENV="development"; uvicorn app.main:app --reload

app = FastAPI()
templates = Jinja2Templates(directory="app/templates")

#statische Dateien
app.mount("/static", StaticFiles(directory="app/static"), name="static")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user.router)
app.include_router(auth.router)
app.include_router(project.router)
app.include_router(todo.router)
app.include_router(rapport.router)
app.include_router(note.router)
app.include_router(attachment.router)
app.include_router(phone.router)


Base.metadata.create_all(bind=engine)

#api um link zu öffenen wenn man bei attachment auf pfad klickt
class FilePathRequest(BaseModel):
    path: str

@app.post("/open-file/")
async def open_file(file_path: FilePathRequest):
    # Zugriff auf das 'path'-Attribut
    file_path_str = file_path.path

    # Holen des aktuellen Windows-Benutzers
    current_user = getpass.getuser()  # Gibt den aktuellen Windows-Benutzer zurück

    # Versuche, die Datei zu öffnen
    if not os.path.exists(file_path_str):
        # Wenn der Pfad nicht existiert, versuche es mit dem angepassten Pfad
        try:
            # Zerlege den Pfad und ersetze den Text zwischen dem zweiten und dritten Backslash
            path_parts = file_path_str.split("\\")
            if len(path_parts) >= 3:
                # Ersetze den Text zwischen dem zweiten und dritten Backslash mit dem Benutzernamen
                path_parts[2] = current_user  # Ersetze den Teil zwischen dem zweiten und dritten Backslash
                new_file_path = "\\".join(path_parts)  # Setze den Pfad wieder zusammen

                # Überprüfe, ob die neue Datei existiert
                if os.path.exists(new_file_path):
                    file_path_str = new_file_path  # Verwende den neuen Pfad
                else:
                    raise HTTPException(status_code=404, detail="Datei nicht gefunden")
            else:
                raise HTTPException(status_code=404, detail="Ungültiger Pfad")

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fehler beim Verarbeiten des Pfads: {str(e)}")

    # Wenn der Pfad existiert, versuche die Datei zu öffnen
    try:
        os.startfile(file_path_str)  # Nur auf Windows-Systemen
        return {"current_user": current_user, "message": "Datei wurde geöffnet", "file_path": file_path_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Öffnen der Datei: {str(e)}")

@app.get("/")
def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/registration")
def registration_page():
    html_file_path = os.path.join(os.getcwd(), "app", "templates", "registration.html")
    return FileResponse(html_file_path)

@app.get("/loginpage")
def login_page():
    # Stelle sicher, dass der Pfad zum Ordner korrekt ist
    html_file_path = os.path.join(os.getcwd(), "app", "templates", "login.html")
    return FileResponse(html_file_path)

