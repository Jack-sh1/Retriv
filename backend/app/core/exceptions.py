from fastapi import HTTPException, status
from typing import Any, Dict, Optional

class CustomHTTPException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: Optional[str] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code

def validation_error(msg: str):
    raise CustomHTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=msg,
        code="VALIDATION_ERROR"
    )

def not_found_error(msg: str):
    raise CustomHTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=msg,
        code="NOT_FOUND"
    )

def server_error(msg: str):
    raise CustomHTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=msg,
        code="INTERNAL_ERROR"
    )
