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
from sqlalchemy.orm import joinedload
from collections import defaultdict


# Stelle sicher, dass du ein Verzeichnis für Templates hast, z. B., "templates"
templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix= "/todos", tags=["Todos"])



@router.get("/", response_class=HTMLResponse)
def get_project(
    request: Request,  # Für das Template erforderlich
    db: Session = Depends(get_db),
    #current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 100,
    skip: int = 0,
    search: Optional[str] = "",
):
    # Datenbankabfrage
    result = db.query(models.Project).all()
    #todos = db.query(models.Todo).join(models.Project).all()
    todos = db.query(models.Todo).all()   
    # Rendere das Template und übergebe die Ergebnisse
    return templates.TemplateResponse(
    "projects.html", {"request": request, "projects": result, "todos": todos}
    )

# Create new todo
@router.post("/create")
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    db_todo = models.Todo(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return {"message": "Todo created successfully", "todo": db_todo}


@router.put("/update/{id}")
async def update_todo(id: int, data:schemas.TodoUpdate, request: Request, db: Session = Depends(get_db)):
    # Hier würdest du die Logik hinzufügen, um das Todo in der Datenbank zu aktualisieren
    # Zum Beispiel:
    todo = db.query(models.Todo).filter(models.Todo.id == id).first()
    
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    todo.todo = data.todo
    todo.week = data.week
    db.commit()

    # Erfolgreiches Update
    return JSONResponse(content={"todo_id": todo.id, "todo": todo.todo, "status": "updated"})


@router.post("/update-todo/{todo_id}")
async def update_todo(todo_id: int, update: schemas.TodoUpdate, db: Session = Depends(get_db)):
    todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    todo.todo = update.todo
    todo.week = update.week
    db.commit()
    db.refresh(todo)
    return {"message": "Todo updated successfully", "todo": todo}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Lösche ein Todo
@router.delete("/{todo_id}")
async def delete_project(todo_id: int, db: Session = Depends(get_db)):
    # Suchen des Projekts in der Datenbank
    todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()

    # Wenn das Projekt nicht existiert, eine 404 Fehler auslösen
    if not todo:
        raise HTTPException(status_code=404, detail="Todo nicht gefunden")
    
    # Löschen des Telefons
    db.delete(todo)
    db.commit()
    print(f"Todo mit ID {todo_id} wurde aus der Datenbank gelöscht")  # DEBUG

    return {"detail": "Todo erfolgreich gelöscht"}




@router.post("/update-week-todos")
def update_week_todos(request: schemas.UpdateWeekRequest, db: Session = Depends(get_db)):
    try:
        # Filtere alle Todos mit week <= eingegebener Wochennummer
        todos = db.query(models.Todo).filter(models.Todo.week <= request.week).all()

        if not todos:
            raise HTTPException(status_code=404, detail="Keine passenden Todos gefunden.")

        # Aktualisiere die Wochennummer
        for todo in todos:
            todo.week = request.week + 1

        # Änderungen speichern
        db.commit()

        return {"message": "Todos erfolgreich aktualisiert.", "updated_count": len(todos)}

    except Exception as e:
        # Fehler behandeln
        raise HTTPException(status_code=500, detail=f"Serverfehler: {str(e)}")


@router.post("/update-todo")
def update_todo(request: schemas.UpdateTodoRequest, db: Session = Depends(get_db)):
    try:
        # Finde das Todo anhand der ID
        todo = db.query(models.Todo).filter(models.Todo.id == request.id).first()
        
        if not todo:
            raise HTTPException(status_code=404, detail="Todo nicht gefunden.")
        
        # Prüfe, ob das Feld existiert und aktualisiere es
        if hasattr(todo, request.field):
            setattr(todo, request.field, request.value)
            db.commit()
            return {"message": "Todo erfolgreich aktualisiert."}
        else:
            raise HTTPException(status_code=400, detail="Ungültiges Feld.")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alltodos", response_class=HTMLResponse)
def get_get_todos_project(request: Request, db: Session = Depends(get_db)):
    # Alle Todos holen, mit den verbundenen Projektdaten
    alltodos_project = (
        db.query(models.Todo)
        .options(joinedload(models.Todo.project))  # Die Projekt-Daten ebenfalls laden
        .order_by(models.Todo.project_id)  # Sortiere nach project_id
        .all()
    )

    # Gruppiere Todos nach project.id
    project_grouped_todos = defaultdict(list)
    for todo in alltodos_project:
        project_grouped_todos[todo.project.id].append(todo)

    return templates.TemplateResponse(
        "todoproject.html", {"request": request, "project_grouped_todos": project_grouped_todos}
    )


