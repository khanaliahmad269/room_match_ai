from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware  # ✅ Import

load_dotenv()

app = FastAPI()

# === CORS Middleware ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# === Security settings ===
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# === Database ===
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["mydatabase"]
users_collection = db["users"]

# === Schemas ===
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# === Utils ===
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def user_response(user):
    """Return user dict without password"""
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
    }

# === Routes ===
@app.post("/signup")
def signup(user: UserSignup):
    print(user)
    # Check if user already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "password": hashed_password,
    }
    result = users_collection.insert_one(new_user)
    created_user = users_collection.find_one({"_id": result.inserted_id})

    token = create_access_token({"sub": str(created_user["_id"])})
    return {
        "status": "success",
        "user": user_response(created_user),
        "access_token": token
    }

@app.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(db_user["_id"])})
    return {
        "status": "success",
        "user": user_response(db_user),
        "access_token": token
    }
