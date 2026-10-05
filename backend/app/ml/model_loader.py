"""
ML Model Loader — loads trained .pkl and .keras models into memory at startup.
"""
import os
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Global model registry
_models: Dict[str, Any] = {}
_scalers: Dict[str, Any] = {}
_encoders: Dict[str, Any] = {}


def load_all_models(models_dir: str):
    """Load all trained models from disk into memory."""
    base = Path(models_dir)
    if not base.exists():
        logger.warning(f"Models dir not found: {models_dir}. Using dummy models.")
        return

    # ── Tabular models ────────────────────────────────────────
    project_map = {
        "variety":  "01_variety",
        "yield":    "02_yield",
        "maturity": "03_maturity",
        "pest":     "05_pest",
    }
    best_models = {
        "variety":  "XGBoost",
        "yield":    "LightGBM",
        "maturity": "RandomForest",
        "pest":     "GradientBoosting",
    }

    for key, folder in project_map.items():
        model_name = best_models[key]
        model_path = base / folder / f"{model_name}.pkl"
        scaler_path = base / folder / "scaler.pkl"
        encoder_path = base / folder / "label_encoder.pkl"

        if model_path.exists():
            _models[key] = joblib.load(model_path)
            logger.info(f"✓ Loaded {key} model: {model_name}")
        else:
            logger.warning(f"⚠ Model not found: {model_path}")

        if scaler_path.exists():
            _scalers[key] = joblib.load(scaler_path)

        if encoder_path.exists():
            _encoders[key] = joblib.load(encoder_path)

    # ── Disease Detection (Keras/TensorFlow) ─────────────────
    disease_dir = base / "04_disease"
    keras_files = list(disease_dir.glob("*_final.keras")) if disease_dir.exists() else []
    best_keras = list(disease_dir.glob("EfficientNetB0_best.keras")) if disease_dir.exists() else []

    model_file = (keras_files + best_keras)[0] if (keras_files or best_keras) else None
    if model_file:
        try:
            import tensorflow as tf
            _models["disease"] = tf.keras.models.load_model(str(model_file))
            _models["disease_name"] = model_file.stem
            logger.info(f"✓ Loaded disease model: {model_file.name}")
        except Exception as e:
            logger.error(f"Failed to load disease model: {e}")
    else:
        logger.warning("⚠ No disease detection model found")

    logger.info(f"Models loaded: {list(_models.keys())}")


def get_model(name: str):
    return _models.get(name)

def get_scaler(name: str):
    return _scalers.get(name)

def get_encoder(name: str):
    return _encoders.get(name)


# ── Disease class names ───────────────────────────────────────
DISEASE_CLASSES = ["Healthy", "Mosaic", "RedRot", "Rust", "Yellow"]
DISEASE_RECOMMENDATIONS = {
    "Healthy":  ["Continue regular monitoring", "Maintain current care practices"],
    "Mosaic":   ["Remove infected plants immediately", "Control aphid vectors with insecticide", "Use virus-free planting material"],
    "RedRot":   ["Destroy infected stools", "Apply fungicide (Carbendazim)", "Improve drainage", "Use resistant varieties"],
    "Rust":     ["Apply fungicide (Mancozeb or Propiconazole)", "Remove heavily infected leaves", "Improve air circulation"],
    "Yellow":   ["Check soil pH and nutrient levels", "Apply balanced fertilizer", "Ensure proper irrigation", "Test for viral infection"],
}

PEST_RECOMMENDATIONS = {
    "High":   ["Apply registered pesticide immediately", "Contact agricultural extension officer", "Isolate affected area"],
    "Medium": ["Monitor closely every 3 days", "Consider targeted pesticide application", "Remove pest-infested shoots"],
    "Low":    ["Continue monitoring weekly", "Use biological control if available", "Maintain field hygiene"],
}
