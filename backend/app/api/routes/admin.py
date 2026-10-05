from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.db.session import get_db
from app.models.scan import Scan, ScanType
from app.models.user import User, UserRole
from app.core.security import oauth2_scheme, decode_token

router = APIRouter(prefix="/admin", tags=["Admin"])


async def get_admin_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    payload = decode_token(token)
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    total_users = await db.execute(select(func.count(User.id)))
    total_scans = await db.execute(select(func.count(Scan.id)))

    disease_dist = await db.execute(
        select(Scan.prediction, func.count(Scan.id))
        .where(Scan.scan_type == ScanType.disease)
        .group_by(Scan.prediction)
        .order_by(desc(func.count(Scan.id)))
    )

    scan_types = await db.execute(
        select(Scan.scan_type, func.count(Scan.id)).group_by(Scan.scan_type)
    )

    accuracy_result = await db.execute(
        select(func.count(Scan.id)).where(Scan.is_correct == True)
    )
    correct = accuracy_result.scalar() or 0
    feedback_total_result = await db.execute(
        select(func.count(Scan.id)).where(Scan.is_correct.isnot(None))
    )
    feedback_total = feedback_total_result.scalar() or 1

    return {
        "total_users": total_users.scalar(),
        "total_scans": total_scans.scalar(),
        "user_accuracy": round(correct / feedback_total * 100, 1),
        "disease_distribution": {row[0]: row[1] for row in disease_dist.all()},
        "scan_types": {row[0]: row[1] for row in scan_types.all()},
    }


@router.get("/users")
async def list_users(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(User).order_by(desc(User.created_at)).limit(limit)
    )
    users = result.scalars().all()
    return [{"id": str(u.id), "name": u.full_name, "email": u.email,
             "region": u.region, "role": u.role, "scans": 0,
             "joined": str(u.created_at), "is_active": u.is_active} for u in users]


@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    role: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role not in ["farmer", "admin", "researcher"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = role
    return {"status": "updated", "user_id": user_id, "new_role": role}


@router.patch("/users/{user_id}/toggle")
async def toggle_user_active(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    return {"status": "updated", "is_active": user.is_active}


@router.get("/disease-trends")
async def disease_trends(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    from sqlalchemy import cast, Date
    result = await db.execute(
        select(
            cast(Scan.created_at, Date).label("date"),
            Scan.prediction,
            func.count(Scan.id).label("count")
        )
        .where(Scan.scan_type == ScanType.disease)
        .group_by(cast(Scan.created_at, Date), Scan.prediction)
        .order_by(desc(cast(Scan.created_at, Date)))
        .limit(200)
    )
    rows = result.all()
    return [{"date": str(r.date), "disease": r.prediction, "count": r.count} for r in rows]
