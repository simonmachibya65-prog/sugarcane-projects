from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, cast, Float
from typing import List, Optional
from app.db.session import get_db
from app.models.scan import Scan, ScanType
from app.models.user import User
from app.schemas.prediction import ScanHistoryItem, FieldPerformanceResponse
from app.core.security import oauth2_scheme, decode_token

router = APIRouter(prefix="/scans", tags=["Scans"])


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    from fastapi import HTTPException
    payload = decode_token(token)
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.get("/history", response_model=List[ScanHistoryItem])
async def get_history(
    scan_type: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Scan).where(Scan.user_id == current_user.id).order_by(desc(Scan.created_at))
    if scan_type:
        query = query.where(Scan.scan_type == scan_type)
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats")
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Scan.scan_type, func.count(Scan.id))
        .where(Scan.user_id == current_user.id)
        .group_by(Scan.scan_type)
    )
    stats = {row[0]: row[1] for row in result.all()}

    disease_result = await db.execute(
        select(Scan.prediction, func.count(Scan.id))
        .where(Scan.user_id == current_user.id, Scan.scan_type == ScanType.disease)
        .group_by(Scan.prediction)
    )
    disease_breakdown = {row[0]: row[1] for row in disease_result.all()}

    return {
        "total_scans": sum(stats.values()),
        "by_type": stats,
        "disease_breakdown": disease_breakdown,
    }


@router.get("/field-performance", response_model=FieldPerformanceResponse)
async def get_field_performance(
    period_days: int = Query(90, ge=7, le=365, description="Look-back window in days"),
    farm_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Aggregates all scan history for the current user over the requested period
    and returns a performance summary: scan counts, disease breakdown, average
    yield, confidence trends, and actionable recommendations.
    """
    from datetime import datetime, timedelta
    from fastapi import HTTPException
    import uuid as _uuid

    cutoff = datetime.utcnow() - timedelta(days=period_days)

    base_filter = [
        Scan.user_id == current_user.id,
        Scan.created_at >= cutoff,
    ]
    if farm_id:
        try:
            base_filter.append(Scan.farm_id == _uuid.UUID(farm_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid farm_id format")

    # ── Scan counts by type ───────────────────────────────────
    type_result = await db.execute(
        select(Scan.scan_type, func.count(Scan.id))
        .where(*base_filter)
        .group_by(Scan.scan_type)
    )
    scan_breakdown: dict = {row[0]: row[1] for row in type_result.all()}
    total_scans = sum(scan_breakdown.values())

    # ── Disease breakdown ─────────────────────────────────────
    disease_result = await db.execute(
        select(Scan.prediction, func.count(Scan.id))
        .where(*base_filter, Scan.scan_type == ScanType.disease)
        .group_by(Scan.prediction)
        .order_by(desc(func.count(Scan.id)))
    )
    disease_breakdown: dict = {row[0]: row[1] for row in disease_result.all()}

    # ── Average yield ─────────────────────────────────────────
    # yield scans store the numeric yield as the prediction string
    yield_result = await db.execute(
        select(Scan.prediction)
        .where(*base_filter, Scan.scan_type == ScanType.yield_prediction)
    )
    yield_values = []
    for (pred,) in yield_result.all():
        try:
            yield_values.append(float(pred))
        except (ValueError, TypeError):
            pass
    avg_yield = round(sum(yield_values) / len(yield_values), 2) if yield_values else None

    # ── Average confidence across all scans ───────────────────
    conf_result = await db.execute(
        select(func.avg(Scan.confidence))
        .where(*base_filter, Scan.confidence.isnot(None))
    )
    avg_conf_raw = conf_result.scalar()
    avg_confidence = round(float(avg_conf_raw), 3) if avg_conf_raw is not None else None

    # ── Most frequent prediction (best/worst signal) ──────────
    top_pred_result = await db.execute(
        select(Scan.prediction, func.count(Scan.id).label("cnt"))
        .where(*base_filter)
        .group_by(Scan.prediction)
        .order_by(desc("cnt"))
        .limit(1)
    )
    top_row = top_pred_result.first()
    best_prediction = top_row[0] if top_row else None

    # ── Generate recommendations ──────────────────────────────
    recommendations: list[str] = []

    if total_scans == 0:
        recommendations.append("No scans recorded in this period. Start scanning your fields to get performance insights.")
    else:
        # Disease-specific advice
        if disease_breakdown:
            most_common_disease = max(disease_breakdown, key=disease_breakdown.get)
            count = disease_breakdown[most_common_disease]
            if most_common_disease != "Healthy":
                recommendations.append(
                    f"Most common disease in period: {most_common_disease} ({count} detections). "
                    "Prioritise treatment and monitor surrounding fields."
                )
            else:
                recommendations.append(f"Majority of disease scans returned Healthy ({count}). Good crop condition.")

        # Yield guidance
        if avg_yield is not None:
            if avg_yield < 200:
                recommendations.append(
                    f"Average predicted yield is low ({avg_yield} quintal/acre). "
                    "Review soil nutrition and irrigation management."
                )
            elif avg_yield < 300:
                recommendations.append(
                    f"Average predicted yield is moderate ({avg_yield} quintal/acre). "
                    "Targeted fertilizer use could push yields higher."
                )
            else:
                recommendations.append(
                    f"Average predicted yield is good ({avg_yield} quintal/acre). "
                    "Maintain current practices."
                )
        else:
            recommendations.append("No yield predictions recorded. Run a Yield Prediction scan to benchmark your fields.")

        # Confidence guidance
        if avg_confidence is not None and avg_confidence < 0.6:
            recommendations.append(
                "Average model confidence is below 60%. Ensure input data is accurate and complete for better predictions."
            )

        # Scan diversity
        if len(scan_breakdown) < 3:
            recommendations.append(
                "You are only using a few scan types. Try Crop Health, Water Stress, or Soil Condition scans for a fuller picture."
            )

        # Water / drought alerts
        if scan_breakdown.get(ScanType.water_stress, 0) == 0 and period_days >= 30:
            recommendations.append("No water stress checks in this period. Run a Water Stress scan to ensure adequate irrigation.")

    return FieldPerformanceResponse(
        total_scans=total_scans,
        scan_breakdown=scan_breakdown,
        disease_breakdown=disease_breakdown,
        avg_yield=avg_yield,
        avg_confidence=avg_confidence,
        best_prediction=best_prediction,
        period_days=period_days,
        recommendations=recommendations,
    )
