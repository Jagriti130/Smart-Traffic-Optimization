from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from ml_model import predict
from rl_env import get_action
import pandas as pd

app = FastAPI(title="Smart Traffic Mini API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class PredictRequest(BaseModel):
    area: str
    hour: int = 9
    day_of_week: int = 1
    is_holiday: int = 0
    weather: str = "Clear"
    temperature: float = 28.0
    vehicle_count: int = 130
    num_lanes: int = 4

class RLRequest(BaseModel):
    queue_n: float
    queue_s: float
    queue_e: float
    queue_w: float
    waiting: float

# ---------- Routes ----------
@app.get("/")
def home():
    return {"message": "Smart Traffic Mini API is running 🚦"}

@app.get("/areas")
def get_areas():
    df = pd.read_csv("data/sample_data.csv")
    areas = df[["area", "latitude", "longitude"]].drop_duplicates().to_dict(orient="records")
    return areas

@app.post("/predict")
def predict_traffic(data: PredictRequest):
    return predict(data.dict())

@app.post("/signal")
def signal_control(data: RLRequest):
    action_id, action_name = get_action(
        [data.queue_n, data.queue_s, data.queue_e, data.queue_w],
        data.waiting
    )
    return {
        "action_id": action_id,
        "action": action_name,
        "recommended_green_seconds": 32
    }