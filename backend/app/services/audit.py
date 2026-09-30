from app.models import AuditLog
from sqlalchemy.orm import Session


def write_audit(db: Session, user_id: str | None, action: str, entity_type: str, entity_id: str | None, details: str = "") -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    )
