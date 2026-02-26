from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger("api.errors")

async def global_http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP Error {exc.status_code} on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "detail": exc.detail, "path": str(request.url.path)},
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "detail": "Invalid parameters in request",
            "validation_errors": exc.errors(),
            "path": str(request.url.path)
        },
    )

async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Server Error on {request.url}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": True, "detail": "Internal Server Error", "path": str(request.url.path)},
    )
