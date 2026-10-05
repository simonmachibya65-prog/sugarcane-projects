from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid, os, aiofiles
from app.db.session import get_db
from app.models.user import User
from app.models.scan import Scan, ScanType
from app.schemas.prediction import (
    DiseaseResponse, PestResponse, YieldResponse,
    MaturityResponse, VarietyResponse, FeedbackRequest, TabularInput,
    CropHealthResponse, WaterStressResponse, DroughtResponse,
    SoilConditionResponse, GrowthStageResponse, WeatherImpactResponse,
)
from app.core.security import oauth2_scheme, decode_token
from app.services import prediction_service
from app.core.config import settings

router = APIRouter(prefix="/predict", tags=["Predictions"])


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    payload = decode_token(token)
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Existing ML endpoints ─────────────────────────────────────

@router.post("/disease", response_model=DiseaseResponse)
async def predict_disease(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    farm_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if image.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only image files accepted (jpg, png, webp)")

    contents = await image.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image too large. Max {settings.MAX_FILE_SIZE_MB}MB")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)

    result = await prediction_service.predict_disease(contents)

    scan = Scan(
        user_id=current_user.id,
        farm_id=uuid.UUID(farm_id) if farm_id else None,
        scan_type=ScanType.disease,
        image_path=filename,
        prediction=result["prediction"],
        confidence=result["confidence"],
        all_predictions=result["all_predictions"],
        model_used=result["model_used"],
        recommendations=result["recommendations"],
        latitude=latitude,
        longitude=longitude,
    )
    db.add(scan)
    await db.flush()
    return DiseaseResponse(scan_id=scan.id, **result)


@router.post("/yield", response_model=YieldResponse)
async def predict_yield(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_yield(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.yield_prediction,
        prediction=str(result["predicted_yield"]),
        input_data=data.model_dump(),
        model_used=result["model_used"],
    )
    db.add(scan)
    await db.flush()
    return YieldResponse(scan_id=scan.id, **result)


@router.post("/maturity", response_model=MaturityResponse)
async def predict_maturity(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_maturity(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.maturity,
        prediction=result["status"],
        input_data=data.model_dump(),
    )
    db.add(scan)
    await db.flush()
    return MaturityResponse(scan_id=scan.id, **result)


@router.post("/variety", response_model=VarietyResponse)
async def predict_variety(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_variety(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.variety,
        prediction=result["predicted_variety"],
        confidence=result["confidence"],
        input_data=data.model_dump(),
    )
    db.add(scan)
    await db.flush()
    return VarietyResponse(scan_id=scan.id, **result)


@router.post("/pest", response_model=PestResponse)
async def predict_pest(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_pest(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.pest,
        prediction=result["pest_level"],
        confidence=result["confidence"],
        input_data=data.model_dump(),
    )
    db.add(scan)
    await db.flush()
    return PestResponse(scan_id=scan.id, **result)


# ── Rule-Based Detection Endpoints ───────────────────────────

@router.post("/crop-health", response_model=CropHealthResponse)
async def predict_crop_health(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_crop_health(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.crop_health,
        prediction=result["status"],
        confidence=round(result["vhi_score"] / 100, 2),
        input_data=data.model_dump(),
        model_used=result["model_used"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    await db.flush()
    return CropHealthResponse(scan_id=scan.id, **result)


@router.post("/water-stress", response_model=WaterStressResponse)
async def predict_water_stress(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_water_stress(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.water_stress,
        prediction=result["stress_level"],
        confidence=round(1 - result["stress_score"] / 100, 2),
        input_data=data.model_dump(),
        model_used=result["model_used"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    await db.flush()
    return WaterStressResponse(scan_id=scan.id, **result)


@router.post("/drought", response_model=DroughtResponse)
async def predict_drought(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_drought(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.drought,
        prediction=result["drought_category"],
        input_data=data.model_dump(),
        model_used=result["model_used"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    await db.flush()
    return DroughtResponse(scan_id=scan.id, **result)


@router.post("/soil-condition", response_model=SoilConditionResponse)
async def predict_soil_condition(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_soil_condition(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.soil_condition,
        prediction=result["overall_condition"],
        confidence=round(result["soil_score"] / 100, 2),
        input_data=data.model_dump(),
        model_used=result["model_used"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    await db.flush()
    return SoilConditionResponse(scan_id=scan.id, **result)


@router.post("/growth-stage", response_model=GrowthStageResponse)
async def predict_growth_stage(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_growth_stage(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.growth_stage,
        prediction=result["stage"],
        input_data=data.model_dump(),
        model_used=result["model_used"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    await db.flush()
    return GrowthStageResponse(scan_id=scan.id, **result)


@router.post("/weather-impact", response_model=WeatherImpactResponse)
async def predict_weather_impact(
    data: TabularInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await prediction_service.predict_weather_impact(data.model_dump())
    scan = Scan(
        user_id=current_user.id,
        scan_type=ScanType.weather_impact,
        prediction=result["weather_rating"],
        confidence=round(1 - result["impact_score"] / 100, 2),
        input_data=data.model_dump(),
        model_used=result["model_used"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    await db.flush()
    return WeatherImpactResponse(scan_id=scan.id, **result)


# ── Feedback ──────────────────────────────────────────────────

@router.post("/feedback")
async def submit_feedback(
    data: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Scan).where(Scan.id == data.scan_id, Scan.user_id == current_user.id))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan.is_correct = data.is_correct
    scan.corrected_label = data.corrected_label
    scan.farmer_notes = data.notes
    return {"status": "feedback saved", "scan_id": data.scan_id}
