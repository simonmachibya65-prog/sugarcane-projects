from sqlalchemy import Column, String, Float, DateTime, Boolean, JSON, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class ScanType(str, enum.Enum):
    disease = "disease"
    pest = "pest"
    yield_prediction = "yield_prediction"
    maturity = "maturity"
    variety = "variety"
    # Rule-based detections
    crop_health = "crop_health"
    water_stress = "water_stress"
    drought = "drought"
    soil_condition = "soil_condition"
    growth_stage = "growth_stage"
    field_performance = "field_performance"
    weather_impact = "weather_impact"


class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=True)

    scan_type = Column(Enum(ScanType), nullable=False)
    image_path = Column(String, nullable=True)

    # Prediction results
    prediction = Column(String, nullable=False)
    confidence = Column(Float, nullable=True)
    all_predictions = Column(JSON, nullable=True)   # {class: probability}
    model_used = Column(String, nullable=True)
    model_version = Column(String, nullable=True)

    # Input farm data (for tabular models)
    input_data = Column(JSON, nullable=True)

    # Farmer feedback
    is_correct = Column(Boolean, nullable=True)
    corrected_label = Column(String, nullable=True)
    farmer_notes = Column(String, nullable=True)

    # Recommendations
    recommendations = Column(JSON, nullable=True)  # list of strings

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scans")
    farm = relationship("Farm", back_populates="scans")
