"""
Prediction Service — handles all ML inference logic.
"""
import numpy as np
import io
from PIL import Image
from typing import Dict, Any, Optional
from app.ml.model_loader import (
    get_model, get_scaler, get_encoder,
    DISEASE_CLASSES, DISEASE_RECOMMENDATIONS, PEST_RECOMMENDATIONS
)


def _prepare_image(image_bytes: bytes, size: int = 224) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((size, size))
    arr = np.array(img, dtype=np.float32)
    return np.expand_dims(arr, axis=0)


def _prepare_tabular(data: Dict, scaler=None) -> np.ndarray:
    """Convert dict of farm data to numpy array for tabular models."""
    # Feature order must match training
    FEATURE_ORDER = [
        "variety", "cane_height_cm", "cane_diameter_cm", "brix_value",
        "tillering_count", "crop_duration_days", "nitrogen_kg_per_acre",
        "phosphorus_kg_per_acre", "potassium_kg_per_acre", "soil_type",
        "soil_ph", "temp_avg_c", "rainfall_total_mm", "humidity_pct",
        "irrigation_method", "growth_stage", "season",
        "disease_type", "disease_severity", "pest_level",
    ]
    from sklearn.preprocessing import LabelEncoder
    row = []
    for feat in FEATURE_ORDER:
        val = data.get(feat, 0)
        if isinstance(val, str):
            # Simple hash encoding for strings
            val = hash(val) % 100
        row.append(float(val) if val is not None else 0.0)
    arr = np.array(row).reshape(1, -1)
    if scaler:
        arr = scaler.transform(arr)
    return arr


# ── Disease Detection ─────────────────────────────────────────
async def predict_disease(image_bytes: bytes) -> Dict:
    model = get_model("disease")
    model_name = get_model("disease_name") or "EfficientNetB0"

    if model is None:
        # Demo response when model not loaded
        return {
            "prediction": "RedRot",
            "confidence": 0.87,
            "all_predictions": {"Healthy": 0.05, "Mosaic": 0.03, "RedRot": 0.87, "Rust": 0.03, "Yellow": 0.02},
            "model_used": "Demo",
            "recommendations": DISEASE_RECOMMENDATIONS["RedRot"],
            "severity": "High",
        }

    # Preprocess — apply EfficientNet preprocessing
    try:
        from tensorflow.keras.applications.efficientnet import preprocess_input
    except ImportError:
        return {
            "prediction": "RedRot", "confidence": 0.87,
            "all_predictions": {"Healthy": 0.05, "Mosaic": 0.03, "RedRot": 0.87, "Rust": 0.03, "Yellow": 0.02},
            "model_used": "Demo (TF not installed)",
            "recommendations": DISEASE_RECOMMENDATIONS["RedRot"], "severity": "High",
        }
    img = _prepare_image(image_bytes, size=224)
    img = preprocess_input(img)

    preds = model.predict(img, verbose=0)[0]
    class_idx = int(np.argmax(preds))
    predicted_class = DISEASE_CLASSES[class_idx]
    confidence = float(preds[class_idx])
    all_preds = {cls: round(float(p), 4) for cls, p in zip(DISEASE_CLASSES, preds)}

    severity = "High" if confidence > 0.8 else "Medium" if confidence > 0.6 else "Low"

    return {
        "prediction": predicted_class,
        "confidence": round(confidence, 4),
        "all_predictions": all_preds,
        "model_used": model_name,
        "recommendations": DISEASE_RECOMMENDATIONS.get(predicted_class, []),
        "severity": severity,
    }


# ── Yield Prediction ──────────────────────────────────────────
async def predict_yield(data: Dict) -> Dict:
    model = get_model("yield")
    scaler = get_scaler("yield")

    if model is None:
        return {"predicted_yield": 280.0, "unit": "quintal/acre",
                "model_used": "Demo", "confidence_interval": {"low": 250.0, "high": 310.0}}

    arr = _prepare_tabular(data, scaler)
    pred = float(model.predict(arr)[0])
    return {
        "predicted_yield": round(pred, 2),
        "unit": "quintal/acre",
        "model_used": "LightGBM",
        "confidence_interval": {"low": round(pred * 0.9, 2), "high": round(pred * 1.1, 2)},
    }


# ── Maturity Prediction ───────────────────────────────────────
async def predict_maturity(data: Dict) -> Dict:
    model = get_model("maturity")
    scaler = get_scaler("maturity")

    if model is None:
        brix = 19.5
    else:
        arr = _prepare_tabular(data, scaler)
        brix = float(model.predict(arr)[0])
        brix = max(15.0, min(25.0, brix))

    if brix >= 20:
        status = "Harvest Ready"
        days = 0
        rec = "Sugarcane is ready for harvest. Schedule cutting within 2 weeks."
    elif brix >= 18:
        status = "Near Ready"
        days = int((20 - brix) / 0.05)
        rec = f"Harvest in approximately {days} days. Monitor Brix weekly."
    else:
        status = "Immature"
        days = int((20 - brix) / 0.05)
        rec = f"Not ready for harvest. Continue current management for ~{days} more days."

    return {
        "brix_value": round(brix, 2),
        "status": status,
        "days_to_harvest": days,
        "recommendation": rec,
    }


# ── Variety Classification ────────────────────────────────────
async def predict_variety(data: Dict) -> Dict:
    model = get_model("variety")
    encoder = get_encoder("variety")

    if model is None:
        return {"predicted_variety": "CoJ64", "confidence": 0.42,
                "all_varieties": {"Co0238": 0.31, "Co98014": 0.27, "CoJ64": 0.42}}

    arr = _prepare_tabular(data)
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(arr)[0]
        class_idx = int(np.argmax(probs))
        classes = encoder.classes_ if encoder else ["Co0238", "Co98014", "CoJ64"]
        predicted = classes[class_idx]
        all_vars = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}
        confidence = float(probs[class_idx])
    else:
        predicted = str(model.predict(arr)[0])
        confidence = 0.5
        all_vars = {predicted: confidence}

    return {
        "predicted_variety": predicted,
        "confidence": round(confidence, 4),
        "all_varieties": all_vars,
    }


# ── Pest Detection ────────────────────────────────────────────
async def predict_pest(data: Dict) -> Dict:
    model = get_model("pest")
    encoder = get_encoder("pest")

    if model is None:
        return {"pest_level": "Medium", "confidence": 0.57,
                "recommendations": PEST_RECOMMENDATIONS["Medium"]}

    arr = _prepare_tabular(data)
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(arr)[0]
        class_idx = int(np.argmax(probs))
        classes = encoder.classes_ if encoder else ["High", "Low", "Medium"]
        pest_level = classes[class_idx]
        confidence = float(probs[class_idx])
    else:
        pest_level = str(model.predict(arr)[0])
        confidence = 0.5

    return {
        "pest_level": pest_level,
        "confidence": round(confidence, 4),
        "recommendations": PEST_RECOMMENDATIONS.get(pest_level, []),
    }


# ── Crop Health ───────────────────────────────────────────────
async def predict_crop_health(data: Dict) -> Dict:
    """
    Computes a Vegetation Health Index (VHI) proxy from tabular farm data.
    VHI = 0.5 * VCI + 0.5 * TCI  (simplified without satellite bands)
    We approximate using rainfall, humidity, temperature, and growth stage.
    """
    rainfall    = float(data.get("rainfall_total_mm") or 0)
    humidity    = float(data.get("humidity_pct") or 0)
    temp        = float(data.get("temp_avg_c") or 30)
    height      = float(data.get("cane_height_cm") or 0)
    nitrogen    = float(data.get("nitrogen_kg_per_acre") or 0)
    growth_stage = str(data.get("growth_stage") or "").lower()

    # Vegetation Condition Index proxy (0–100): rainfall + humidity drive greenness
    vci = min(100.0, (rainfall / 200) * 50 + (humidity / 100) * 50)

    # Temperature Condition Index proxy (0–100): optimal range 28–32 °C for sugarcane
    temp_deviation = abs(temp - 30)
    tci = max(0.0, 100.0 - temp_deviation * 5)

    # Height bonus — taller cane indicates healthy growth
    height_score = min(20.0, height / 15)

    # Nitrogen adequacy bonus
    nitrogen_score = min(10.0, nitrogen / 5)

    vhi = round(0.5 * vci + 0.5 * tci + height_score + nitrogen_score, 1)
    vhi = min(100.0, vhi)

    if vhi >= 75:
        status = "Excellent"
        color = "green"
        summary = "Crop is in excellent health. Continue current management practices."
        recommendations = [
            "Maintain current irrigation and fertilization schedule.",
            "Conduct routine scouting for early pest/disease signs.",
            "Document current practices as a benchmark for future seasons.",
        ]
    elif vhi >= 55:
        status = "Good"
        color = "lime"
        summary = "Crop health is good with minor areas for improvement."
        recommendations = [
            "Review nitrogen application — a slight increase may improve yield.",
            "Monitor humidity levels and adjust irrigation accordingly.",
            "Check for early disease symptoms on lower leaves.",
        ]
    elif vhi >= 35:
        status = "Moderate"
        color = "yellow"
        summary = "Crop health is moderate — action required to prevent decline."
        recommendations = [
            "Increase irrigation frequency if rainfall is below 100 mm/month.",
            "Apply foliar micronutrient spray to boost leaf greenness.",
            "Scout for pests every 3–4 days.",
            "Consider soil testing to check nutrient deficiencies.",
        ]
    else:
        status = "Poor"
        color = "red"
        summary = "Crop health is poor. Immediate intervention recommended."
        recommendations = [
            "Urgently review water availability and irrigation system.",
            "Apply balanced NPK fertilizer immediately.",
            "Consult agricultural extension officer.",
            "Check for root diseases or severe pest infestations.",
        ]

    # Growth-stage specific advice
    stage_tips = {
        "early":  "At early stage: focus on root development — ensure consistent moisture.",
        "mid":    "At mid stage: maximise tillering — top-dress nitrogen now.",
        "late":   "At late stage: reduce nitrogen, focus on maturity and Brix build-up.",
        "germination": "At germination: ensure soil moisture is adequate for sprouting.",
        "tillering":   "At tillering: this is the critical growth stage — do not skip irrigation.",
        "grand growth": "At grand growth: water demand is highest — irrigate every 7–10 days.",
        "maturation":   "At maturation: reduce irrigation, allow natural stress to boost Brix.",
    }
    tip = stage_tips.get(growth_stage, "")
    if tip:
        recommendations.append(tip)

    return {
        "vhi_score": vhi,
        "vci": round(vci, 1),
        "tci": round(tci, 1),
        "status": status,
        "color": color,
        "summary": summary,
        "recommendations": recommendations,
        "model_used": "Rule-Based VHI",
    }


# ── Water Stress ──────────────────────────────────────────────
async def predict_water_stress(data: Dict) -> Dict:
    """
    Determines water stress level using rainfall, humidity, temperature,
    and irrigation method.
    """
    rainfall    = float(data.get("rainfall_total_mm") or 0)
    humidity    = float(data.get("humidity_pct") or 0)
    temp        = float(data.get("temp_avg_c") or 30)
    irrigation  = str(data.get("irrigation_method") or "none").lower()
    duration    = int(data.get("crop_duration_days") or 90)

    # Sugarcane water requirement ~1500–2500 mm/season
    # Approximate monthly equivalent: 125–210 mm/month
    days_factor = max(duration / 30, 1)
    effective_water = rainfall + (
        60 if irrigation in ("drip", "sprinkler") else
        40 if irrigation == "flood" else 0
    )

    # Evapotranspiration estimate — higher temp increases demand
    et_demand = 5 + (temp - 25) * 0.5  # mm/day baseline
    monthly_demand = et_demand * 30

    deficit = max(0.0, monthly_demand - effective_water)
    supply_ratio = min(1.0, effective_water / max(monthly_demand, 1))

    # Humidity correction — low humidity increases stress
    humidity_penalty = max(0.0, (60 - humidity) / 60) * 20
    stress_score = (1 - supply_ratio) * 100 + humidity_penalty

    if stress_score < 20:
        level = "None"
        status = "No Water Stress"
        summary = "Crop has adequate water supply. No intervention needed."
        recommendations = [
            "Maintain current irrigation schedule.",
            "Monitor soil moisture weekly.",
        ]
    elif stress_score < 40:
        level = "Mild"
        status = "Mild Water Stress"
        summary = "Slight water deficit detected. Minor irrigation adjustment recommended."
        recommendations = [
            "Increase irrigation frequency by 1–2 additional sessions per week.",
            "Apply mulching to reduce evaporation from soil surface.",
            "Monitor leaf rolling — early sign of stress.",
        ]
    elif stress_score < 65:
        level = "Moderate"
        status = "Moderate Water Stress"
        summary = "Moderate water deficit — yield will be affected without intervention."
        recommendations = [
            "Switch to drip irrigation if not already in use.",
            "Irrigate every 5–7 days with at least 50 mm application.",
            "Avoid nitrogen application until water stress is relieved.",
            "Check irrigation pipes for leaks or blockages.",
        ]
    else:
        level = "Severe"
        status = "Severe Water Stress"
        summary = "Severe water deficit. Immediate irrigation required to save the crop."
        recommendations = [
            "Irrigate immediately with a minimum of 75 mm.",
            "Contact extension officer for emergency support.",
            "If drought conditions persist, consider harvesting early.",
            "Prioritise fields with younger/higher-value crop.",
        ]

    return {
        "stress_level": level,
        "stress_score": round(stress_score, 1),
        "status": status,
        "supply_ratio": round(supply_ratio, 2),
        "effective_water_mm": round(effective_water, 1),
        "estimated_demand_mm": round(monthly_demand, 1),
        "summary": summary,
        "recommendations": recommendations,
        "model_used": "Rule-Based Water Balance",
    }


# ── Drought ───────────────────────────────────────────────────
async def predict_drought(data: Dict) -> Dict:
    """
    Drought assessment using a simplified SPI-like score.
    Uses cumulative rainfall and temperature to classify drought severity.
    """
    rainfall    = float(data.get("rainfall_total_mm") or 0)
    temp        = float(data.get("temp_avg_c") or 30)
    humidity    = float(data.get("humidity_pct") or 50)
    duration    = int(data.get("crop_duration_days") or 90)
    irrigation  = str(data.get("irrigation_method") or "none").lower()

    # Morogoro avg monthly rainfall ~75–120 mm (long rains) or ~20–40 mm (dry)
    # Normalise rainfall against a 100 mm/month benchmark
    months = max(duration / 30, 1)
    monthly_rainfall = rainfall / months
    rainfall_anomaly = (monthly_rainfall - 100) / 100  # negative = below normal

    # Aridity index: lower humidity + higher temp = more arid
    aridity = max(0.0, (temp - 25) / 15) + max(0.0, (60 - humidity) / 60)

    # SPI-like score: negative = dry, lower = more severe
    spi_proxy = rainfall_anomaly - aridity * 0.5

    # Irrigation credit softens drought severity
    irr_credit = 0.3 if irrigation in ("drip", "sprinkler") else 0.15 if irrigation == "flood" else 0
    spi_adjusted = spi_proxy + irr_credit

    if spi_adjusted >= 0:
        category = "No Drought"
        severity = "None"
        summary = "Rainfall and conditions are within normal range. No drought detected."
        recommendations = [
            "Continue normal farm operations.",
            "Maintain water conservation practices for dry-season preparedness.",
        ]
    elif spi_adjusted >= -0.5:
        category = "Mild Drought"
        severity = "Mild"
        summary = "Slightly below-normal rainfall. Monitor conditions closely."
        recommendations = [
            "Begin water conservation measures now.",
            "Reduce water losses through mulching.",
            "Defer non-essential fertilizer applications.",
        ]
    elif spi_adjusted >= -1.0:
        category = "Moderate Drought"
        severity = "Moderate"
        summary = "Rainfall is significantly below normal. Drought conditions developing."
        recommendations = [
            "Activate supplementary irrigation immediately.",
            "Reduce field operations that compact soil.",
            "Apply drought-tolerant management: reduce canopy, control weeds.",
            "Consult meteorological department for seasonal outlook.",
        ]
    elif spi_adjusted >= -1.5:
        category = "Severe Drought"
        severity = "Severe"
        summary = "Severe drought conditions. Significant yield loss likely without action."
        recommendations = [
            "Prioritise irrigation for youngest and highest-value fields.",
            "Consider emergency water sourcing (boreholes, water trucking).",
            "Document losses for insurance/government support claims.",
            "Reduce plant population to lower water demand.",
        ]
    else:
        category = "Extreme Drought"
        severity = "Extreme"
        summary = "Extreme drought. Crop survival at risk. Emergency action required."
        recommendations = [
            "Harvest any near-mature cane immediately to recover value.",
            "Apply minimum survival irrigation to ratoon crop only.",
            "Report to district agricultural office for emergency assistance.",
            "Plan for replanting in next rainy season.",
        ]

    return {
        "drought_category": category,
        "severity": severity,
        "spi_score": round(spi_adjusted, 2),
        "monthly_rainfall_mm": round(monthly_rainfall, 1),
        "summary": summary,
        "recommendations": recommendations,
        "model_used": "Rule-Based SPI Proxy",
    }


# ── Soil Condition ────────────────────────────────────────────
async def predict_soil_condition(data: Dict) -> Dict:
    """
    Evaluates soil health from pH, nutrient levels, and soil type.
    """
    soil_ph    = float(data.get("soil_ph") or 6.5)
    soil_type  = str(data.get("soil_type") or "loamy").lower()
    nitrogen   = float(data.get("nitrogen_kg_per_acre") or 0)
    phosphorus = float(data.get("phosphorus_kg_per_acre") or 0)
    potassium  = float(data.get("potassium_kg_per_acre") or 0)

    issues = []
    recommendations = []
    score = 100.0

    # ── pH scoring (optimal 6.0–7.5 for sugarcane) ──
    if soil_ph < 5.0:
        ph_status = "Very Acidic"
        score -= 30
        issues.append("Soil is very acidic (pH < 5.0)")
        recommendations.append("Apply agricultural lime at 2–3 tonnes/acre to raise pH.")
        recommendations.append("Avoid ammonium-based fertilizers which further acidify soil.")
    elif soil_ph < 6.0:
        ph_status = "Acidic"
        score -= 15
        issues.append("Soil is moderately acidic (pH 5.0–6.0)")
        recommendations.append("Apply lime at 1 tonne/acre to bring pH above 6.0.")
    elif soil_ph <= 7.5:
        ph_status = "Optimal"
    elif soil_ph <= 8.5:
        ph_status = "Alkaline"
        score -= 15
        issues.append("Soil is alkaline (pH 7.5–8.5)")
        recommendations.append("Apply sulphur or acidifying fertilizers (ammonium sulphate).")
        recommendations.append("Improve drainage to prevent salt build-up.")
    else:
        ph_status = "Very Alkaline"
        score -= 30
        issues.append("Soil is very alkaline (pH > 8.5) — nutrient uptake severely limited")
        recommendations.append("Apply gypsum and sulphur amendments urgently.")
        recommendations.append("Consult soil specialist before next planting.")

    # ── Nitrogen scoring (optimal 40–80 kg/acre for sugarcane) ──
    if nitrogen < 20:
        n_status = "Deficient"
        score -= 20
        issues.append("Nitrogen is very low (< 20 kg/acre)")
        recommendations.append("Apply urea or CAN at 40–50 kg/acre immediately.")
    elif nitrogen < 40:
        n_status = "Low"
        score -= 10
        issues.append("Nitrogen is below optimal (20–40 kg/acre)")
        recommendations.append("Top-dress with 20–30 kg/acre nitrogen in the next 2 weeks.")
    elif nitrogen <= 80:
        n_status = "Optimal"
    else:
        n_status = "Excessive"
        score -= 10
        issues.append("Nitrogen may be excessive (> 80 kg/acre) — risk of lodging")
        recommendations.append("Skip next nitrogen application cycle.")

    # ── Phosphorus scoring (optimal 20–60 kg/acre) ──
    if phosphorus < 10:
        p_status = "Deficient"
        score -= 15
        issues.append("Phosphorus is deficient (< 10 kg/acre)")
        recommendations.append("Apply DAP or SSP at 25–30 kg/acre at planting or ratoon.")
    elif phosphorus <= 60:
        p_status = "Adequate"
    else:
        p_status = "Excessive"
        score -= 5
        issues.append("Phosphorus may be excessive")

    # ── Potassium scoring (optimal 50–120 kg/acre) ──
    if potassium < 25:
        k_status = "Deficient"
        score -= 15
        issues.append("Potassium is deficient (< 25 kg/acre)")
        recommendations.append("Apply MOP (Muriate of Potash) at 40–50 kg/acre.")
        recommendations.append("Potassium improves stalk strength and disease resistance.")
    elif potassium <= 120:
        k_status = "Adequate"
    else:
        k_status = "Excessive"
        score -= 5

    # ── Soil type characteristics ──
    soil_notes = {
        "clay":   "Clay soil: good nutrient retention but prone to waterlogging — ensure drainage.",
        "sandy":  "Sandy soil: low nutrient retention — increase fertilizer frequency and use organic matter.",
        "loamy":  "Loamy soil: ideal for sugarcane — good water and nutrient balance.",
        "silt":   "Silt soil: moderate fertility but may compact — avoid heavy machinery in wet conditions.",
        "black":  "Black cotton soil: high clay content — excellent fertility but difficult to work when wet.",
    }
    soil_note = soil_notes.get(soil_type, f"Soil type '{soil_type}': follow general sugarcane management guidelines.")
    recommendations.append(soil_note)

    score = max(0.0, round(score, 1))
    if score >= 75:
        overall = "Good"
    elif score >= 50:
        overall = "Moderate"
    elif score >= 25:
        overall = "Poor"
    else:
        overall = "Critical"

    return {
        "overall_condition": overall,
        "soil_score": score,
        "ph_status": ph_status,
        "nitrogen_status": n_status,
        "phosphorus_status": p_status,
        "potassium_status": k_status,
        "soil_type": soil_type.capitalize(),
        "issues": issues,
        "recommendations": recommendations,
        "model_used": "Rule-Based Soil Scoring",
    }


# ── Growth Stage ──────────────────────────────────────────────
async def predict_growth_stage(data: Dict) -> Dict:
    """
    Determines growth stage from crop_duration_days and provides
    stage-specific management recommendations.
    """
    duration      = int(data.get("crop_duration_days") or 0)
    height        = float(data.get("cane_height_cm") or 0)
    input_stage   = str(data.get("growth_stage") or "").strip().lower()
    tillering     = int(data.get("tillering_count") or 0)
    variety       = str(data.get("variety") or "unknown")

    # Infer stage from crop age (days) — standard sugarcane calendar
    if duration <= 30:
        inferred = "Germination"
        stage_num = 1
        description = "Seeds/setts are germinating. Shoot emergence expected."
        duration_range = "0–30 days"
    elif duration <= 90:
        inferred = "Tillering"
        stage_num = 2
        description = "Primary shoots developing. Tillering determines final stalk count."
        duration_range = "30–90 days"
    elif duration <= 210:
        inferred = "Grand Growth"
        stage_num = 3
        description = "Rapid elongation phase. Maximum water and nutrient demand."
        duration_range = "90–210 days"
    elif duration <= 330:
        inferred = "Maturation"
        stage_num = 4
        description = "Sugar accumulation phase. Reduce inputs, increase Brix."
        duration_range = "210–330 days"
    else:
        inferred = "Harvest Ready"
        stage_num = 5
        description = "Crop has exceeded normal growing period. Harvest urgently."
        duration_range = "330+ days"

    # Use provided stage if given, fall back to inferred
    stage = input_stage.capitalize() if input_stage else inferred

    # Stage-specific recommendations
    stage_recommendations = {
        "Germination": [
            "Ensure soil moisture is consistently available for germination.",
            "Apply basal dose of phosphorus and potassium fertilizer.",
            "Control weeds early — competition at this stage is most harmful.",
            "Protect from waterlogging; ensure field drainage.",
        ],
        "Tillering": [
            "Apply first split dose of nitrogen (40–50% of total N).",
            "Irrigate every 7–10 days if rainfall is insufficient.",
            "Scout and control early-stage pests (early shoot borer).",
            "Gap-fill bare patches to maintain plant population.",
            f"Target tiller count: 8–12 tillers per stool (current: {tillering}).",
        ],
        "Grand Growth": [
            "Apply second split dose of nitrogen.",
            "Increase irrigation frequency — water demand peaks now.",
            "Control internode borer with appropriate pesticide.",
            "Avoid any mechanical damage to stalks.",
            "This stage drives 60–70% of final yield — do not skip irrigation.",
        ],
        "Maturation": [
            "Stop nitrogen fertilization — it delays ripening.",
            "Reduce irrigation to encourage sugar accumulation.",
            "Test Brix every 2 weeks — target ≥ 20 before harvest.",
            "Avoid flooding — waterlogging dilutes sugar content.",
        ],
        "Harvest Ready": [
            "Schedule harvest immediately to avoid sugar loss.",
            "Ensure transport and mill scheduling is confirmed.",
            "Leave healthy ratoon stumps for next cycle.",
            "Apply ratoon management: trash mulching + fertilizer within 2 weeks of harvest.",
        ],
    }

    recs = stage_recommendations.get(stage, stage_recommendations.get(inferred, [
        "Continue routine monitoring and management for current growth stage.",
    ]))

    # Height validation
    expected_heights = {
        "Germination": (5, 30),
        "Tillering": (30, 100),
        "Grand Growth": (100, 250),
        "Maturation": (200, 350),
        "Harvest Ready": (280, 400),
    }
    height_note = None
    if height > 0:
        low, high = expected_heights.get(inferred, (0, 999))
        if height < low:
            height_note = f"Cane height ({height} cm) is below expected range for {inferred} stage ({low}–{high} cm) — possible growth retardation."
        elif height > high:
            height_note = f"Cane height ({height} cm) is above expected range — good growth progress."

    return {
        "stage": stage,
        "inferred_stage": inferred,
        "stage_number": stage_num,
        "description": description,
        "crop_age_days": duration,
        "expected_duration_range": duration_range,
        "cane_height_cm": height,
        "height_assessment": height_note,
        "variety": variety,
        "recommendations": recs,
        "model_used": "Rule-Based Growth Calendar",
    }


# ── Weather Impact ────────────────────────────────────────────
async def predict_weather_impact(data: Dict) -> Dict:
    """
    Assesses weather impact on crop using temperature and rainfall data.
    Produces an impact score and targeted recommendations.
    """
    temp        = float(data.get("temp_avg_c") or 30)
    rainfall    = float(data.get("rainfall_total_mm") or 0)
    humidity    = float(data.get("humidity_pct") or 60)
    duration    = int(data.get("crop_duration_days") or 90)
    growth_stage = str(data.get("growth_stage") or "mid").lower()
    season      = str(data.get("season") or "").lower()

    impacts = []
    recommendations = []
    impact_score = 0  # 0 = no impact, 100 = maximum negative impact

    # ── Temperature impact ──────────────────────────────────────
    # Optimal: 28–35 °C; growth stops below 20 °C; heat stress above 38 °C
    if temp < 20:
        impacts.append(f"Low temperature ({temp}°C) — below growth threshold of 20°C")
        impact_score += 30
        recommendations.append("Cold stress: delay planting if below 18°C. Use trash mulching to retain soil heat.")
    elif temp < 25:
        impacts.append(f"Cool temperatures ({temp}°C) — slower growth expected")
        impact_score += 10
        recommendations.append("Moderate cold: maintain irrigation to prevent frost damage on cold nights.")
    elif temp <= 35:
        impacts.append(f"Optimal temperature ({temp}°C) — good growing conditions")
    elif temp <= 38:
        impacts.append(f"High temperature ({temp}°C) — heat stress beginning")
        impact_score += 15
        recommendations.append("Heat stress: increase irrigation frequency to compensate for high evapotranspiration.")
    else:
        impacts.append(f"Extreme heat ({temp}°C) — severe heat stress on crop")
        impact_score += 35
        recommendations.append("Extreme heat: irrigate every 3–4 days minimum. Avoid daytime fertilizer application.")

    # ── Rainfall impact ────────────────────────────────────────
    monthly_rain = rainfall / max(duration / 30, 1)

    if monthly_rain < 25:
        impacts.append(f"Very low rainfall ({monthly_rain:.0f} mm/month) — drought conditions")
        impact_score += 35
        recommendations.append("Critically low rainfall: activate all available irrigation. Consider emergency water sources.")
    elif monthly_rain < 75:
        impacts.append(f"Low rainfall ({monthly_rain:.0f} mm/month) — below crop requirement")
        impact_score += 20
        recommendations.append("Supplement rainfall with irrigation to meet 125–150 mm/month target.")
    elif monthly_rain <= 200:
        impacts.append(f"Adequate rainfall ({monthly_rain:.0f} mm/month) — within optimal range")
    elif monthly_rain <= 300:
        impacts.append(f"High rainfall ({monthly_rain:.0f} mm/month) — risk of waterlogging")
        impact_score += 15
        recommendations.append("Open drainage channels to prevent root asphyxiation.")
        recommendations.append("Delay fertilizer application until waterlogging subsides.")
    else:
        impacts.append(f"Excessive rainfall ({monthly_rain:.0f} mm/month) — flooding risk")
        impact_score += 40
        recommendations.append("Urgent: open all field drains immediately.")
        recommendations.append("Assess fields for lodging and root rot after flooding.")

    # ── Humidity impact ────────────────────────────────────────
    if humidity > 85:
        impacts.append(f"Very high humidity ({humidity}%) — elevated disease risk")
        impact_score += 15
        recommendations.append("High humidity: increase scouting for fungal diseases (Red Rot, Smut). Apply preventive fungicide if needed.")
    elif humidity < 30:
        impacts.append(f"Very low humidity ({humidity}%) — high evapotranspiration")
        impact_score += 10
        recommendations.append("Low humidity: increase irrigation and consider micro-sprinkler cooling on very hot days.")

    # ── Season context ─────────────────────────────────────────
    if season == "kharif":
        recommendations.append("Kharif (wet) season: monitor for fungal diseases and excess waterlogging.")
    elif season == "rabi":
        recommendations.append("Rabi (dry) season: ensure reliable irrigation and protect from night chills.")

    # ── Overall rating ────────────────────────────────────────
    impact_score = min(100, impact_score)
    if impact_score < 20:
        rating = "Favourable"
        summary = "Weather conditions are favourable for sugarcane growth."
    elif impact_score < 40:
        rating = "Mildly Unfavourable"
        summary = "Minor weather stress factors detected — monitor and adjust management."
    elif impact_score < 65:
        rating = "Moderately Unfavourable"
        summary = "Significant weather stress. Yield impact expected without corrective action."
    else:
        rating = "Severely Unfavourable"
        summary = "Severe weather stress conditions. Immediate action required to protect the crop."

    if not recommendations:
        recommendations.append("Weather conditions are optimal. Continue normal management.")

    return {
        "weather_rating": rating,
        "impact_score": impact_score,
        "summary": summary,
        "temp_avg_c": temp,
        "monthly_rainfall_mm": round(monthly_rain, 1),
        "humidity_pct": humidity,
        "impacts": impacts,
        "recommendations": recommendations,
        "model_used": "Rule-Based Weather Analysis",
    }
