from pydantic import BaseModel

class CoverLetter(BaseModel):
    subject: str
    greeting: str
    body: str
    closing: str