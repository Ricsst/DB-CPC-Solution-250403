from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import database, schemas, models, utils, oauth2
import logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invalid Credentials")

    if not utils.verify(user_credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invalid Credentials")

    # create a token
    access_token = oauth2.create_access_token(data={"id": user.id})

    # return a token
    print(f"Generated token: {access_token}")
    return{"access_token": access_token, "token_type": "bearer"}


@router.get("/check_token")
def check_token(current_user: models.User = Depends(oauth2.get_current_user)):
    # Wenn der Token gültig ist und der Benutzer gefunden wurde, gibt es eine erfolgreiche Antwort
    return {"message": f"Token ist gültig! Willkommen, {current_user.email}"}