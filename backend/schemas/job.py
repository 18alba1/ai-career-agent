from datetime import datetime
from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    url: str | None = None

class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    description: str
    url: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }