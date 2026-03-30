from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from .auth import hash_password
from .models import Attendance, ClassRoom, Student, Subject, Teacher, User


def seed_data(db: Session) -> None:
    if db.query(User).first():
        return

    admin = User(
        name="Aarav Admin",
        email="admin@smartattendance.edu",
        password=hash_password("Admin@123"),
        role="admin",
    )
    teacher_user = User(
        name="Neha Teacher",
        email="teacher@smartattendance.edu",
        password=hash_password("Teacher@123"),
        role="teacher",
    )
    student_user = User(
        name="Riya Student",
        email="student@smartattendance.edu",
        password=hash_password("Student@123"),
        role="student",
    )
    db.add_all([admin, teacher_user, student_user])
    db.flush()

    classes = [
        ClassRoom(name="BSc CS - A"),
        ClassRoom(name="BSc CS - B"),
        ClassRoom(name="IT - A"),
        ClassRoom(name="IT - B"),
    ]
    db.add_all(classes)
    db.flush()

    teacher = Teacher(user_id=teacher_user.id, subject="Data Structures", class_name="BSc CS - A")
    student = Student(
        user_id=student_user.id,
        student_class="BSc CS - A",
        year="Year 2",
        prn="PRN2026-001",
        birth_date="2004-08-12",
        address="Sector 21, New Delhi",
    )
    db.add_all([teacher, student])

    subjects = [
        Subject(name="Data Structures", code="CS201", class_name="BSc CS - A", year="Year 2"),
        Subject(name="Operating Systems", code="CS202", class_name="BSc CS - A", year="Year 2"),
        Subject(name="Database Systems", code="CS203", class_name="BSc CS - B", year="Year 2"),
        Subject(name="Computer Networks", code="CS204", class_name="IT - A", year="Year 3"),
    ]
    db.add_all(subjects)
    db.flush()

    today = date.today()
    records = []
    for offset in range(10):
        records.append(
            Attendance(
                student_id=student.id,
                subject="Data Structures",
                date=today - timedelta(days=offset),
                status="Present" if offset % 4 != 0 else "Absent",
            )
        )
    db.add_all(records)
    db.commit()
