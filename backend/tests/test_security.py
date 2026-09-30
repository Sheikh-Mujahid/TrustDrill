from app.routers.documents import _safe_name
from fastapi import HTTPException
import pytest


def test_path_traversal_rejected():
    with pytest.raises(HTTPException):
        _safe_name("..\\..\\windows\\system32\\config")
