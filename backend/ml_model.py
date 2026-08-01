import os
from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier, XGBRegressor

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "sample_data.csv"
MODEL_DIR = BASE_DIR / "models"

os.makedirs(MODEL_DIR, exist_ok=True)


def _model_path(name: str) -> Path:
    return MODEL_DIR / name


def train_ml():
    df = pd.read_csv(DATA_PATH)

    le_weather = LabelEncoder()
    le_area = LabelEncoder()
    le_category = LabelEncoder()

    df["weather_enc"] = le_weather.fit_transform(df["weather"])
    df["area_enc"] = le_area.fit_transform(df["area"])
    df["category_enc"] = le_category.fit_transform(df["category"])

    joblib.dump(le_weather, _model_path("weather_encoder.pkl"))
    joblib.dump(le_area, _model_path("area_encoder.pkl"))
    joblib.dump(le_category, _model_path("category_encoder.pkl"))

    features = [
        "area_enc",
        "hour",
        "day_of_week",
        "is_holiday",
        "weather_enc",
        "temperature",
        "vehicle_count",
        "num_lanes",
    ]

    X = df[features]
    y_reg = df[["traffic_density", "congestion_pct", "waiting_time"]]

    X_train, _, y_train, _ = train_test_split(X, y_reg, test_size=0.2, random_state=42)

    reg = XGBRegressor(n_estimators=120, max_depth=4, learning_rate=0.1, random_state=42)
    reg.fit(X_train, y_train)
    joblib.dump(reg, _model_path("density_model.pkl"))

    clf = XGBClassifier(n_estimators=100, max_depth=3, random_state=42)
    clf.fit(X, df["category_enc"])
    joblib.dump(clf, _model_path("category_model.pkl"))

    print("✅ ML models trained successfully!")


def predict(data: dict):
    if not _model_path("density_model.pkl").exists() or not _model_path("category_model.pkl").exists():
        train_ml()

    reg = joblib.load(_model_path("density_model.pkl"))
    clf = joblib.load(_model_path("category_model.pkl"))
    le_weather = joblib.load(_model_path("weather_encoder.pkl"))
    le_area = joblib.load(_model_path("area_encoder.pkl"))
    le_category = joblib.load(_model_path("category_encoder.pkl"))

    try:
        area_enc = le_area.transform([data["area"]])[0]
    except Exception:
        area_enc = 0

    weather_enc = le_weather.transform([data.get("weather", "Clear")])[0]

    X = [[
        area_enc,
        data["hour"],
        data["day_of_week"],
        data.get("is_holiday", 0),
        weather_enc,
        data.get("temperature", 28),
        data.get("vehicle_count", 120),
        data.get("num_lanes", 4),
    ]]

    dens, cong, wait = reg.predict(X)[0]
    cat_idx = clf.predict(X)[0]
    category = le_category.inverse_transform([cat_idx])[0]

    return {
        "area": data["area"],
        "traffic_density": round(float(max(0, min(1, dens))), 3),
        "congestion_pct": round(float(max(0, min(100, cong))), 1),
        "waiting_time": round(float(max(0, wait)), 1),
        "category": category,
    }