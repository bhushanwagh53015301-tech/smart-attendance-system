from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(student|teacher|admin)$")
    student_class: Optional[str] = None
    year: Optional[str] = None
    prn: Optional[str] = None
    birth_date: Optional[str] = None
    address: Optional[str] = None
    subject: Optional[str] = None
    class_name: Optional[str] = None


class UserUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(..., pattern="^(student|teacher|admin)$")
    password: Optional[str] = Field(default=None, min_length=6)
    student_class: Optional[str] = None
    year: Optional[str] = None
    prn: Optional[str] = None
    birth_date: Optional[str] = None
    address: Optional[str] = None
    subject: Optional[str] = None
    class_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str


class StudentOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: EmailStr
    student_class: str
    year: str
    prn: str
    birth_date: Optional[str] = None
    address: Optional[str] = None


class TeacherOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: EmailStr
    subject: str
    class_name: Optional[str] = None


class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=20)
    class_name: Optional[str] = None
    year: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=20)
    class_name: Optional[str] = None
    year: Optional[str] = None


class SubjectOut(BaseModel):
    id: int
    name: str
    code: str
    class_name: Optional[str] = None
    year: Optional[str] = None


class ClassCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)


class ClassUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)


class ClassOut(BaseModel):
    id: int
    name: str


class AttendanceMark(BaseModel):
    student_id: int
    subject: str
    date: date
    status: str = Field(..., pattern="^(Present|Absent)$")


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    subject: str
    date: date
    status: str


class AttendanceBulk(BaseModel):
    items: List[AttendanceMark]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginIdRequest(BaseModel):
    student_id: str = Field(..., min_length=1)
    passcode: str = Field(..., min_length=1)


class SelfAttendanceRequest(BaseModel):
    student_id: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1, max_length=120)
    session_code: str = Field(..., min_length=1, max_length=120)
    location: Optional[str] = None
    device_id: Optional[str] = None


class DashboardStats(BaseModel):
    total_students: int
    total_teachers: int
    total_subjects: int
    attendance_rate: float
    low_attendance_count: int
