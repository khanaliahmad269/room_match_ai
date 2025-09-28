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

# === For Search Pipeline ===
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
import torch
import json
from sentence_transformers import SentenceTransformer, util
from openai import OpenAI

load_dotenv()

app = FastAPI()

# === CORS Middleware ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Security settings ===
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# === Database ===
MONGO_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

try:
    client.server_info()  # 🔎 Test connection at startup
    print("✅ Connected to MongoDB successfully")
except Exception as e:
    print("❌ MongoDB connection failed:", e)
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

# For search endpoint
class SearchRequest(BaseModel):
    query: str

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

# ============================
# === Search Graph Setup ===
# ============================

class State(TypedDict):
    messages: Annotated[list, add_messages]
    results: list

graph_builder = StateGraph(State)

# Load embeddings + profiles
model = SentenceTransformer('all-MiniLM-L6-v2')
profile_embeddings = torch.load("profile_embeddings.pt")
with open("profiles.json", "r", encoding="utf-8") as f:
    profiles = json.load(f)

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client_ai = OpenAI(api_key=GEMINI_API_KEY,
                   base_url="https://generativelanguage.googleapis.com/v1beta/openai/")

def similarity_search(state: State):
    query = state["messages"][-1].content
    top_k = 5
    query_embedding = model.encode(query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, profile_embeddings)[0]
    top_results = torch.topk(cos_scores, k=top_k)
    results = []
    for score, idx in zip(top_results.values, top_results.indices):
        results.append({
            "profile": profiles[idx],
            "score": score.item()
        })
    state["results"] = results
    return state

from concurrent.futures import ThreadPoolExecutor, as_completed

def red_flag_agent(state: State):
    """Run Gemini API calls concurrently but keep node synchronous for langgraph"""
    user_query = state["messages"][-1].content
    conflicts = []

    # Use ThreadPoolExecutor for concurrent API calls
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_profile = {}

        for result in state["results"]:
            profile = result["profile"]
            prompt = prompt = f"""
User is looking for: "{user_query}"
Profile (room/ad): "{profile['raw_profile_text']}"
Explain in one line why this ad/room along with roomemate is a good match for the user's requirement.
"""


            future = executor.submit(
                lambda p=profile, pr=prompt, s=result: {
                    "profile": p,
                    "conflict": client_ai.chat.completions.create(
                        model="gemini-2.0-flash",
                        messages=[{"role": "user", "content": pr}],
                        max_tokens=150
                    ).choices[0].message.content,
                    "score": s["score"]
                }
            )
            future_to_profile[future] = profile

        # Collect results as they complete
        for future in as_completed(future_to_profile):
            try:
                conflicts.append(future.result())
            except Exception as e:
                profile = future_to_profile[future]
                conflicts.append({
                    "profile": profile,
                    "conflict": f"Error: {str(e)}",
                    "score": next(r["score"] for r in state["results"] if r["profile"] == profile)
                })

    state["results"] = conflicts
    return state

# def red_flag_agent(state: State):
#     user_query = state["messages"][-1].content
#     conflicts = []
#     for result in state["results"]:
#         profile = result["profile"]
#         print(profile)
#         prompt = f"""
#         User query: "{user_query}"
#         Profile: "{profile['raw_profile_text']}"
#         Identify lifestyle similarities or positive matching points between the user query and the profile.
#         Be concise and mention only the relevant good points. If there are no strong matches, say "No strong match".
#         """
#         try:
#             response = client_ai.chat.completions.create(
#                 model="gemini-2.0-flash",
#                 messages=[{"role": "user", "content": prompt}],
#                 max_tokens=150
#             )
#             conflict_text = response.choices[0].message.content
#         except Exception as e:
#             conflict_text = f"Error: {str(e)}"
#         conflicts.append({
#             "profile": profile,
#             "conflict": conflict_text,
#             "score": result["score"]
#         })
#     state["results"] = conflicts
#     return state

graph_builder.add_node("similarity_search", similarity_search)
graph_builder.add_node("red_flag_agent", red_flag_agent)
graph_builder.add_edge(START, "similarity_search")
graph_builder.add_edge("similarity_search", "red_flag_agent")
graph_builder.add_edge("red_flag_agent", END)
graph = graph_builder.compile()

# === /search route ===
@app.post("/search")
def search_endpoint(request: SearchRequest):
    try:
        updated_state = graph.invoke(
            {"messages": [{"role": "user", "content": request.query}], "results": []}
        )
        results_list = []
        for result in updated_state["results"]:
            results_list.append({
                "profile": result["profile"],
                "score": round(result["score"], 3),
                "similarity": result["conflict"]
            })
        return {"status": "success", "query": request.query, "results": results_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))







