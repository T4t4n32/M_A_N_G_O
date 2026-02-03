from pydantic import BaseModel, EmailStr
from mango_api.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    institution_id: int | None
    is_active: bool


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole
    institution_id: int | None


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
