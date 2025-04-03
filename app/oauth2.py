from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from . import schemas, database, models
from .config import settings

# Token-Authentifizierung
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# JWT Einstellungen
SECRET_KEY = settings.secret_key  # Generiert mit: openssl rand -hex 32
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

# Token erstellen
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "sub": str(data["id"])})  # Falsch, 'id' existiert nicht

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"JWT-Token erstellt: {encoded_jwt}")  # Debugging
    return encoded_jwt

# Token validieren
def verify_access_token(token: str, credentials_exception):
    print(f"Token erhalten-2: {token}")  # Debugging
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Payload erfolgreich entschlüsselt: {payload}")  # Debugging
    except jwt.ExpiredSignatureError:
        print("Fehler: Token ist abgelaufen!")
        raise credentials_exception  # Raise hier, damit die Funktion abbricht
    except jwt.InvalidTokenError:
        print("Fehler: Token ist ungültig!")
        raise credentials_exception
    except Exception as e:
        print(f"Unerwarteter Fehler: {e}")
        raise credentials_exception

    # Dieser Code wird jetzt immer ausgeführt, wenn kein Fehler passiert ist
    id: str = payload.get("sub")
    if id is None:
        raise credentials_exception

    print(f"Token überprüft, User-ID: {id}")  # Debugging
    return {"id": id}  # Falls du ein Schema `schemas.TokenData(id=id)` hast, ersetze das entsprechend

# Benutzer aus Token extrahieren
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    print(f"Token erhalten get user: {token}")  # Debugging

    token_data = verify_access_token(token, credentials_exception)
    print(f"Token-Daten get user: {token_data}")
    user = db.query(models.User).filter(models.User.id == int(token_data["id"])).first()


    if user is None:
        print(f"Kein Benutzer gefunden für ID: {token_data.get('id')}")  # Falls 'id' nicht existiert
        raise credentials_exception

    print(f"Angemeldeter Benutzer: {user.email} (ID: {user.id})")  # Debugging
    return user
