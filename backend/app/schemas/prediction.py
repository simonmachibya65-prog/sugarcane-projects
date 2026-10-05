from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from uuid import UUID
from datetime import datetime


class DiseaseResponse(BaseModel):
    scan_id: UUID
    prediction: str
    confidence: float
    all_predictions: Dict[str, float]
    model_used: str
    recommendations: List[str]
    severity: str


class PestResponse(BaseModel):
    scan_id: UUID
    pest_level: str
    confidence: float
    recommendations: List[str]


class YieldResponse(BaseModel):
    scan_id: UUID
    predicted_yield: float
    unit: str = "quintal/acre"
    model_used: str
    confidence_interval: Dict[str, float]


class MaturityResponse(BaseModel):
    scan_id: UUID
    brix_value: float
    status: str           # Immature / Near Ready / Harvest Ready
    days_to_harvest: Optional[int]
    recommendation: str


class VarietyResponse(BaseModel):
    scan_id: UUID
    predicted_variety: str
    confidence: float
    all_varieties: Dict[str, float]


class ScanHistoryItem(BaseModel):
    id: UUID
    scan_type: str
    prediction: str
    confidence: Optional[float]
    created_at: datetime
    image_path: Optional[str]
    is_correct: Optional[bool]

    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    scan_id: UUID
    is_correct: bool
    corrected_label: Optional[str] = None
    notes: Optional[str] = None


class TabularInput(BaseModel):
    variety: Optional[str] = None
    cane_height_cm: Optional[float] = None
    cane_diameter_cm: Optional[float] = None
    brix_value: Optional[float] = None
    tillering_count: Optional[int] = None
    crop_duration_days: Optional[int] = None
    nitrogen_kg_per_acre: Optional[float] = None
    phosphorus_kg_per_acre: Optional[float] = None
    potassium_kg_per_acre: Optional[float] = None
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = None
    temp_avg_c: Optional[float] = None
    rainfall_total_mm: Optional[float] = None
    humidity_pct: Optional[float] = None
    irrigation_method: Optional[str] = None
    growth_stage: Optional[str] = None
    season: Optional[str] = None
    disease_type: Optional[str] = None
    disease_severity: Optional[str] = None
    pest_level: Optional[str] = None


# ── Rule-Based Detection Schemas ─────────────────────────────

class CropHealthResponse(BaseModel):
    scan_id: UUID
    vhi_score: float
    vci: float
    tci: float
    status: str          # Excellent / Good / Moderate / Poor
    color: str
    summary: str
    recommendations: List[str]
    model_used: str


class WaterStressResponse(BaseModel):
    scan_id: UUID
    stress_level: str    # None / Mild / Moderate / Severe
    stress_score: float
    status: str
    supply_ratio: float
    effective_water_mm: float
    estimated_demand_mm: float
    summary: str
    recommendations: List[str]
    model_used: str


class DroughtResponse(BaseModel):
    scan_id: UUID
    drought_category: str   # No Drought / Mild / Moderate / Severe / Extreme
    severity: str
    spi_score: float
    monthly_rainfall_mm: float
    summary: str
    recommendations: List[str]
    model_used: str


class SoilConditionResponse(BaseModel):
    scan_id: UUID
    overall_condition: str   # Good / Moderate / Poor / Critical
    soil_score: float
    ph_status: str
    nitrogen_status: str
    phosphorus_status: str
    potassium_status: str
    soil_type: str
    issues: List[str]
    recommendations: List[str]
    model_used: str


class GrowthStageResponse(BaseModel):
    scan_id: UUID
    stage: str
    inferred_stage: str
    stage_number: int
    description: str
    crop_age_days: int
    expected_duration_range: str
    cane_height_cm: float
    height_assessment: Optional[str]
    variety: str
    recommendations: List[str]
    model_used: str


class WeatherImpactResponse(BaseModel):
    scan_id: UUID
    weather_rating: str    # Favourable / Mildly Unfavourable / Moderately / Severely
    impact_score: float
    summary: str
    temp_avg_c: float
    monthly_rainfall_mm: float
    humidity_pct: float
    impacts: List[str]
    recommendations: List[str]
    model_used: str


# ── Field Performance (SQL aggregation — no scan_id) ─────────

class FieldPerformanceScan(BaseModel):
    scan_type: str
    total: int
    latest: Optional[datetime]

    class Config:
        from_attributes = True


class FieldPerformanceResponse(BaseModel):
    total_scans: int
    scan_breakdown: Dict[str, int]
    disease_breakdown: Dict[str, int]
    avg_yield: Optional[float]
    avg_confidence: Optional[float]
    best_prediction: Optional[str]
    period_days: int
    recommendations: List[str]
