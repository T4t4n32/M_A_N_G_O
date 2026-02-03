from pydantic import BaseModel


class InstitutionCreate(BaseModel):
    name: str
    domain: str


class InstitutionResponse(BaseModel):
    id: int
    name: str
    domain: str

    class Config:
        from_attributes = True
