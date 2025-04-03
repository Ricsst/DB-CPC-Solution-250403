from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

class Settings(BaseSettings):
    database_hostname : str
    database_port : str
    database_password : str 
    database_name : str
    database_username : str 
    secret_key: str 
    algorithm: str
    access_token_expire_minutes: int
    #driver: str

class Config:
    env_file = f".env.{os.getenv('ENV', 'development')}"  # Lädt automatisch die passende .env
    extra = "allow"  # Erlaubt zusätzliche Eingabewerte wie ENV

    print(f"Lade .env-Datei: {env_file}")  # Debugging

    load_dotenv(env_file)  # Lädt die Umgebungsvariablen

    # Testausgabe, ob die Variablen geladen wurden
    print(f"SECRET_KEY: {os.getenv('SECRET_KEY')}")
    print(f"ALGORITHM: {os.getenv('ALGORITHM')}")
    print(f"ACCESS_TOKEN_EXPIRE_MINUTES: {os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')}")    
    
settings = Settings()




