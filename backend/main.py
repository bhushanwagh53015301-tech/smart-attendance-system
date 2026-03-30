from __future__ import annotations

from datetime import date
from io import StringIO
from typing import List, Optional

import csv
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case, func, text
from sqlalchemy.orm import Session

from .auth import (
    create_access_token,
    get_current_user,
    get_db,
    hash_password,
    require_role,
    verify_password,
)
from .database import Base, engine
from .models import Attendance, ClassRoom, Student, Subject, Teacher, User
from .schemas import (
    AttendanceBulk,
    AttendanceOut,
    ClassCreate,
    ClassOut,
    ClassUpdate,
    DashboardStats,
    LoginIdRequest,
    LoginRequest,
    SelfAttendanceRequest,
    StudentOut,
    SubjectCreate,
    SubjectUpdate,
    SubjectOut,
    TeacherOut,
    Token,
    UserCreate,
    UserUpdate,
    UserOut,
)
from .seed import seed_data

Base.metadata.create_all(bind=engine)
PRIMARY_ADMIN_EMAIL = "yadav@smjoshi.edu"
PRIMARY_ADMIN_PASSWORD = "Yadav@123"
PRIMARY_ADMIN_NAME = "Yadav Madam"
REQUIRED_STUDENT_ACCOUNTS = [
    {
        "name": "Sonam Shirke",
        "email": "sonam@smjoshi.edu",
        "password": "Sonam@123",
        "student_class": "BSc CS - A",
        "year": "Year 3",
        "prn": "SMJ-24001",
        "birth_date": "2005-04-18",
        "address": "Hadapsar, Pune",
    },
    {
        "name": "Shraddha",
        "email": "shraddha@smjoshi.edu",
        "password": "Shraddha@123",
        "student_class": "BSc CS - B",
        "year": "Year 2",
        "prn": "SMJ-24002",
        "birth_date": "2006-01-07",
        "address": "Manjri, Pune",
    },
    {
        "name": "Kajal Kamthe",
        "email": "kajal@smjoshi.edu",
        "password": "Kajal@123",
        "student_class": "IT - A",
        "year": "Year 3",
        "prn": "SMJ-24003",
        "birth_date": "2005-09-22",
        "address": "Hadapsar, Pune",
    },
    {
        "name": "Riya Student",
        "email": "student@smartattendance.edu",
        "password": "Student@123",
        "student_class": "BSc CS - A",
        "year": "Year 2",
        "prn": "PRN2026-001",
        "birth_date": "2004-08-12",
        "address": "Sector 21, New Delhi",
    },
]
REQUIRED_TEACHER_ACCOUNTS = [
    {
        "name": "Pratima Mam",
        "email": "pratima@smjoshi.edu",
        "password": "Pratima@123",
        "subject": "Database Management Systems",
        "class_name": "BSc CS - A",
    },
    {
        "name": "Nayan Mam",
        "email": "nayan@smjoshi.edu",
        "password": "Nayan@123",
        "subject": "Operating Systems",
        "class_name": "BSc CS - B",
    },
    {
        "name": "Ganesh Sir",
        "email": "ganesh@smjoshi.edu",
        "password": "Ganesh@123",
        "subject": "Data Structures",
        "class_name": "IT - A",
    },
]


def run_migrations() -> None:
    with engine.begin() as conn:
        result = conn.execute(text("PRAGMA table_info(students)"))
        columns = {row[1] for row in result}

        if "year" not in columns:
            conn.execute(text("ALTER TABLE students ADD COLUMN year VARCHAR(20) DEFAULT 'Year 1'"))
        if "prn" not in columns:
            conn.execute(text("ALTER TABLE students ADD COLUMN prn VARCHAR(40) DEFAULT 'PRN-0000'"))
        if "birth_date" not in columns:
            conn.execute(text("ALTER TABLE students ADD COLUMN birth_date VARCHAR(20)"))
        if "address" not in columns:
            conn.execute(text("ALTER TABLE students ADD COLUMN address VARCHAR(255)"))

        conn.execute(text("UPDATE students SET prn = 'PRN-' || id WHERE prn IS NULL OR prn = ''"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_students_prn ON students (prn)"))

        teacher_result = conn.execute(text("PRAGMA table_info(teachers)"))
        teacher_columns = {row[1] for row in teacher_result}
        if "class_name" not in teacher_columns:
            conn.execute(text("ALTER TABLE teachers ADD COLUMN class_name VARCHAR(120)"))

        subject_result = conn.execute(text("PRAGMA table_info(subjects)"))
        subject_columns = {row[1] for row in subject_result}
        if "class_name" not in subject_columns:
            conn.execute(text("ALTER TABLE subjects ADD COLUMN class_name VARCHAR(120)"))
        if "year" not in subject_columns:
            conn.execute(text("ALTER TABLE subjects ADD COLUMN year VARCHAR(20)"))

        # Older DBs had a global UNIQUE constraint on subjects.name.
        # Rebuild table to allow same subject name across different class/year pairs.
        index_rows = conn.execute(text("PRAGMA index_list(subjects)")).fetchall()
        has_unique_name = False
        for index_row in index_rows:
            is_unique = int(index_row[2]) == 1
            index_name = index_row[1]
            if not is_unique:
                continue
            index_info = conn.execute(text(f"PRAGMA index_info('{index_name}')")).fetchall()
            index_columns = [col[2] for col in index_info]
            if index_columns == ["name"]:
                has_unique_name = True
                break

        if has_unique_name:
            conn.execute(text("ALTER TABLE subjects RENAME TO subjects_old"))
            conn.execute(
                text(
                    """
                    CREATE TABLE subjects (
                        id INTEGER PRIMARY KEY,
                        name VARCHAR(120) NOT NULL,
                        code VARCHAR(20) NOT NULL UNIQUE,
                        class_name VARCHAR(120),
                        year VARCHAR(20)
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO subjects (id, name, code, class_name, year)
                    SELECT id, name, code, class_name, year
                    FROM subjects_old
                    """
                )
            )
            conn.execute(text("DROP TABLE subjects_old"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_subjects_id ON subjects (id)"))


def ensure_class_exists(db: Session, class_name: str) -> None:
    exists = db.query(ClassRoom).filter(ClassRoom.name == class_name).first()
    if not exists:
        raise HTTPException(status_code=400, detail="Selected class is not available in class master")


def normalize_year_label(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    mapping = {
        "year 1": "Year 1",
        "1st": "Year 1",
        "first": "Year 1",
        "year 2": "Year 2",
        "2nd": "Year 2",
        "second": "Year 2",
        "year 3": "Year 3",
        "3rd": "Year 3",
        "third": "Year 3",
    }
    normalized = mapping.get(raw.lower(), raw)
    if normalized not in {"Year 1", "Year 2", "Year 3"}:
        raise HTTPException(status_code=400, detail="year must be Year 1, Year 2, or Year 3")
    return normalized


def ensure_primary_admin(db: Session) -> None:
    admin_user = db.query(User).filter(func.lower(User.email) == PRIMARY_ADMIN_EMAIL.lower()).first()
    if admin_user:
        admin_user.role = "admin"
        admin_user.name = admin_user.name or PRIMARY_ADMIN_NAME
        admin_user.password = hash_password(PRIMARY_ADMIN_PASSWORD)
        db.commit()
        return

    admin_user = User(
        name=PRIMARY_ADMIN_NAME,
        email=PRIMARY_ADMIN_EMAIL,
        password=hash_password(PRIMARY_ADMIN_PASSWORD),
        role="admin",
    )
    db.add(admin_user)
    db.commit()


def ensure_default_classes(db: Session) -> None:
    if db.query(ClassRoom).count() > 0:
        return
    default_classes = ["BSc CS - A", "BSc CS - B", "IT - A", "IT - B"]
    for class_name in default_classes:
        db.add(ClassRoom(name=class_name))
    db.commit()


def _compact_code(value: str, limit: int = 18) -> str:
    compact = "".join(ch for ch in value.upper() if ch.isalnum())
    return (compact or "SUBJ")[:limit]


def _next_subject_code(base: str, used_codes: set[str]) -> str:
    code = _compact_code(base, 20)
    if code not in used_codes:
        used_codes.add(code)
        return code
    counter = 1
    while True:
        suffix = f"{counter:02d}"
        candidate = f"{_compact_code(base, 20 - len(suffix))}{suffix}"
        if candidate not in used_codes:
            used_codes.add(candidate)
            return candidate
        counter += 1


def ensure_default_subjects(db: Session) -> None:
    classes = db.query(ClassRoom).order_by(ClassRoom.name).all()
    if not classes:
        return

    templates = {
        "Year 1": [
            ("Programming Fundamentals", "PF"),
            ("Applied Mathematics", "AM"),
            ("Digital Electronics", "DE"),
            ("Communication Skills", "COMM"),
        ],
        "Year 2": [
            ("Data Structures", "DS"),
            ("Database Management Systems", "DBMS"),
            ("Operating Systems", "OS"),
            ("Computer Networks", "CN"),
        ],
        "Year 3": [
            ("Software Engineering", "SE"),
            ("Web Technologies", "WT"),
            ("Machine Learning Basics", "ML"),
            ("Cloud Computing", "CC"),
        ],
    }

    existing = db.query(Subject).all()
    used_codes = {subject.code for subject in existing}
    existing_keys = {(subject.name, subject.class_name, subject.year) for subject in existing}

    created = False
    for class_item in classes:
        class_prefix = _compact_code("".join(token[:1] for token in class_item.name.split()), 4)
        for year_label, items in templates.items():
            year_num = year_label.split()[-1]
            for name, short in items:
                key = (name, class_item.name, year_label)
                if key in existing_keys:
                    continue
                code = _next_subject_code(f"{class_prefix}{year_num}{short}", used_codes)
                db.add(
                    Subject(
                        name=name,
                        code=code,
                        class_name=class_item.name,
                        year=year_label,
                    )
                )
                existing_keys.add(key)
                created = True

    if created:
        db.commit()


def ensure_required_student_accounts(db: Session) -> None:
    changed = False
    for account in REQUIRED_STUDENT_ACCOUNTS:
        user_by_email = db.query(User).filter(func.lower(User.email) == account["email"].lower()).first()
        student_by_prn = db.query(Student).filter(Student.prn == account["prn"]).first()

        # Prefer existing account by email. If missing, reuse the account linked to this PRN.
        # This avoids UNIQUE(PRN) startup failures when old/manual data already exists.
        user = user_by_email
        if not user and student_by_prn:
            user = db.query(User).filter(User.id == student_by_prn.user_id).first()

        if user:
            user.name = account["name"]
            user.email = account["email"]
            user.role = "student"
            user.password = hash_password(account["password"])
        else:
            user = User(
                name=account["name"],
                email=account["email"],
                password=hash_password(account["password"]),
                role="student",
            )
            db.add(user)
            db.flush()
        changed = True

        student = db.query(Student).filter(Student.user_id == user.id).first()
        if not student and student_by_prn:
            student = student_by_prn
            student.user_id = user.id

        if student:
            student.student_class = account["student_class"]
            student.year = account["year"]
            student.prn = account["prn"]
            student.birth_date = account["birth_date"]
            student.address = account["address"]
        else:
            db.add(
                Student(
                    user_id=user.id,
                    student_class=account["student_class"],
                    year=account["year"],
                    prn=account["prn"],
                    birth_date=account["birth_date"],
                    address=account["address"],
                )
            )
    if changed:
        db.commit()


def ensure_required_teacher_accounts(db: Session) -> None:
    changed = False
    for account in REQUIRED_TEACHER_ACCOUNTS:
        user = db.query(User).filter(func.lower(User.email) == account["email"].lower()).first()
        if user:
            user.name = account["name"]
            user.role = "teacher"
            user.password = hash_password(account["password"])
        else:
            user = User(
                name=account["name"],
                email=account["email"],
                password=hash_password(account["password"]),
                role="teacher",
            )
            db.add(user)
            db.flush()
        changed = True

        teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
        if teacher:
            teacher.subject = account["subject"]
            teacher.class_name = account["class_name"]
        else:
            db.add(
                Teacher(
                    user_id=user.id,
                    subject=account["subject"],
                    class_name=account["class_name"],
                )
            )
    if changed:
        db.commit()


app = FastAPI(title="Smart Attendance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_seed():
    run_migrations()
    db = next(get_db())
    try:
        seed_data(db)
        ensure_primary_admin(db)
        ensure_default_classes(db)
        ensure_default_subjects(db)
        ensure_required_student_accounts(db)
        ensure_required_teacher_accounts(db)
    finally:
        db.close()


@app.post("/register", response_model=UserOut)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    if current_user.role == "teacher" and payload.role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only create student accounts")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if payload.role == "student":
        if not payload.student_class:
            raise HTTPException(status_code=400, detail="student_class is required")
        ensure_class_exists(db, payload.student_class)
        if not payload.prn:
            raise HTTPException(status_code=400, detail="prn is required")
        db.add(
            Student(
                user_id=user.id,
                student_class=payload.student_class,
                year=payload.year or "Year 1",
                prn=payload.prn,
                birth_date=payload.birth_date,
                address=payload.address,
            )
        )
    if payload.role == "teacher":
        if not payload.subject:
            raise HTTPException(status_code=400, detail="subject is required")
        if payload.class_name:
            ensure_class_exists(db, payload.class_name)
        db.add(Teacher(user_id=user.id, subject=payload.subject, class_name=payload.class_name))

    db.commit()
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role)


@app.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=token, role=user.role, user_id=user.id)


@app.post("/login-id", response_model=Token)
def login_with_student_id(payload: LoginIdRequest, db: Session = Depends(get_db)):
    sid = payload.student_id.strip()
    record = (
        db.query(Student, User)
        .join(User, Student.user_id == User.id)
        .filter(Student.prn == sid)
        .first()
    )
    if not record and sid.isdigit():
        record = (
            db.query(Student, User)
            .join(User, Student.user_id == User.id)
            .filter(User.id == int(sid))
            .first()
        )
    if not record:
        raise HTTPException(status_code=404, detail="Student not found")

    student, user = record
    passcode = payload.passcode.strip()
    passcode_valid = verify_password(passcode, user.password) or (student.birth_date and passcode == student.birth_date)
    if not passcode_valid:
        raise HTTPException(status_code=401, detail="Invalid student ID or passcode")

    token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=token, role=user.role, user_id=user.id)


@app.get("/students", response_model=List[StudentOut])
def get_students(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    students = (
        db.query(Student, User)
        .join(User, Student.user_id == User.id)
        .order_by(User.name)
        .all()
    )
    return [
        StudentOut(
            id=student.id,
            user_id=user.id,
            name=user.name,
            email=user.email,
            student_class=student.student_class,
            year=student.year,
            prn=student.prn,
            birth_date=student.birth_date,
            address=student.address,
        )
        for student, user in students
    ]


@app.get("/students/me", response_model=StudentOut)
def get_student_profile(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("student")),
):
    record = (
        db.query(Student, User)
        .join(User, Student.user_id == User.id)
        .filter(Student.user_id == user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Student profile not found")
    student, record_user = record
    return StudentOut(
        id=student.id,
        user_id=record_user.id,
        name=record_user.name,
        email=record_user.email,
        student_class=student.student_class,
        year=student.year,
        prn=student.prn,
        birth_date=student.birth_date,
        address=student.address,
    )


@app.get("/teachers", response_model=List[TeacherOut])
def get_teachers(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    teachers = (
        db.query(Teacher, User)
        .join(User, Teacher.user_id == User.id)
        .order_by(User.name)
        .all()
    )
    return [
        TeacherOut(
            id=teacher.id,
            user_id=user.id,
            name=user.name,
            email=user.email,
            subject=teacher.subject,
            class_name=teacher.class_name,
        )
        for teacher, user in teachers
    ]


@app.get("/subjects", response_model=List[SubjectOut])
def list_subjects(
    class_name: Optional[str] = None,
    year: Optional[str] = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Subject)
    if class_name:
        query = query.filter(Subject.class_name == class_name)
    if year:
        query = query.filter(Subject.year == normalize_year_label(year))
    subjects = query.order_by(Subject.name).all()
    return [
        SubjectOut(id=s.id, name=s.name, code=s.code, class_name=s.class_name, year=s.year)
        for s in subjects
    ]


@app.post("/subjects", response_model=SubjectOut)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    if payload.class_name:
        ensure_class_exists(db, payload.class_name)
    normalized_year = normalize_year_label(payload.year)

    exists = db.query(Subject).filter(Subject.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    duplicate_name = (
        db.query(Subject)
        .filter(
            Subject.name == payload.name,
            Subject.class_name == payload.class_name,
            Subject.year == normalized_year,
        )
        .first()
    )
    if duplicate_name:
        raise HTTPException(status_code=400, detail="Subject already exists for this class/year")

    subject = Subject(name=payload.name, code=payload.code, class_name=payload.class_name, year=normalized_year)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        class_name=subject.class_name,
        year=subject.year,
    )


@app.delete("/subjects/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return Response(status_code=204)


@app.patch("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if payload.class_name:
        ensure_class_exists(db, payload.class_name)
    normalized_year = normalize_year_label(payload.year)

    duplicate_name = (
        db.query(Subject)
        .filter(
            Subject.name == payload.name,
            Subject.class_name == payload.class_name,
            Subject.year == normalized_year,
            Subject.id != subject_id,
        )
        .first()
    )
    if duplicate_name:
        raise HTTPException(status_code=400, detail="Subject already exists for this class/year")

    duplicate_code = (
        db.query(Subject)
        .filter(Subject.code == payload.code, Subject.id != subject_id)
        .first()
    )
    if duplicate_code:
        raise HTTPException(status_code=400, detail="Subject code already exists")

    subject.name = payload.name
    subject.code = payload.code
    subject.class_name = payload.class_name
    subject.year = normalized_year
    db.commit()
    db.refresh(subject)
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        class_name=subject.class_name,
        year=subject.year,
    )


@app.get("/classes", response_model=List[ClassOut])
def list_classes(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    classes = db.query(ClassRoom).order_by(ClassRoom.name).all()
    return [ClassOut(id=item.id, name=item.name) for item in classes]


@app.post("/classes", response_model=ClassOut)
def create_class(
    payload: ClassCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    existing = db.query(ClassRoom).filter(ClassRoom.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class already exists")
    item = ClassRoom(name=payload.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    ensure_default_subjects(db)
    return ClassOut(id=item.id, name=item.name)


@app.patch("/classes/{class_id}", response_model=ClassOut)
def update_class(
    class_id: int,
    payload: ClassUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    item = db.query(ClassRoom).filter(ClassRoom.id == class_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Class not found")
    duplicate = (
        db.query(ClassRoom)
        .filter(ClassRoom.name == payload.name, ClassRoom.id != class_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Class already exists")
    item.name = payload.name
    db.commit()
    db.refresh(item)
    return ClassOut(id=item.id, name=item.name)


@app.delete("/classes/{class_id}", status_code=204)
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    item = db.query(ClassRoom).filter(ClassRoom.id == class_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)


@app.post("/attendance/mark", response_model=List[AttendanceOut])
def mark_attendance(
    payload: AttendanceBulk,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("teacher")),
):
    results = []
    for item in payload.items:
        record = Attendance(
            student_id=item.student_id,
            subject=item.subject,
            date=item.date,
            status=item.status,
        )
        db.add(record)
        db.flush()
        student = (
            db.query(Student, User)
            .join(User, Student.user_id == User.id)
            .filter(Student.id == item.student_id)
            .first()
        )
        name = student[1].name if student else "Unknown"
        results.append(
            AttendanceOut(
                id=record.id,
                student_id=item.student_id,
                student_name=name,
                subject=item.subject,
                date=item.date,
                status=item.status,
            )
        )
    db.commit()

    return results


@app.post("/attendance/self", response_model=AttendanceOut)
def self_attendance(
    payload: SelfAttendanceRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("student")),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    sid = payload.student_id.strip()
    valid_identity = sid == student.prn or (sid.isdigit() and int(sid) == user.id)
    if not valid_identity:
        raise HTTPException(status_code=403, detail="Student ID does not match your account")

    record = Attendance(
        student_id=student.id,
        subject=payload.subject.strip(),
        date=date.today(),
        status="Present",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AttendanceOut(
        id=record.id,
        student_id=student.id,
        student_name=user.name,
        subject=record.subject,
        date=record.date,
        status=record.status,
    )


@app.get("/attendance/view", response_model=List[AttendanceOut])
def view_attendance(
    student_id: Optional[int] = None,
    subject: Optional[str] = None,
    date_filter: Optional[date] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Attendance, Student, User).join(Student, Attendance.student_id == Student.id).join(
        User, Student.user_id == User.id
    )
    if user.role == "student":
        query = query.filter(Student.user_id == user.id)
    elif student_id:
        query = query.filter(Student.id == student_id)

    if subject:
        query = query.filter(Attendance.subject == subject)
    if date_filter:
        query = query.filter(Attendance.date == date_filter)

    records = query.order_by(Attendance.date.desc()).all()
    return [
        AttendanceOut(
            id=attendance.id,
            student_id=student.id,
            student_name=record_user.name,
            subject=attendance.subject,
            date=attendance.date,
            status=attendance.status,
        )
        for attendance, student, record_user in records
    ]


@app.get("/attendance/export")
def export_attendance(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    rows = (
        db.query(Attendance, Student, User)
        .join(Student, Attendance.student_id == Student.id)
        .join(User, Student.user_id == User.id)
        .order_by(Attendance.date.desc())
        .all()
    )

    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow(["Student", "Class", "Subject", "Date", "Status"])
    for attendance, student, record_user in rows:
        writer.writerow(
            [
                record_user.name,
                student.student_class,
                attendance.subject,
                attendance.date.isoformat(),
                attendance.status,
            ]
        )

    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_export.csv"},
    )


@app.get("/attendance/qr")
def qr_payload(
    subject: str,
    student_class: str,
    date_value: Optional[date] = None,
    _user: User = Depends(require_role("teacher")),
):
    payload = {
        "subject": subject,
        "class": student_class,
        "date": (date_value or date.today()).isoformat(),
    }
    return {"payload": payload}


@app.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total_students = db.query(Student).count()
    total_teachers = db.query(Teacher).count()
    total_subjects = db.query(Subject).count()

    attendance_query = db.query(
        func.count(Attendance.id),
        func.sum(case((Attendance.status == "Present", 1), else_=0)),
    )
    total_records, present_records = attendance_query.first()
    attendance_rate = (present_records or 0) / total_records * 100 if total_records else 0

    low_attendance_count = 0
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            student_records = (
                db.query(Attendance)
                .filter(Attendance.student_id == student.id)
                .all()
            )
            total = len(student_records)
            present = len([r for r in student_records if r.status == "Present"])
            rate = (present / total * 100) if total else 0
            low_attendance_count = 1 if rate < 75 else 0
            attendance_rate = rate
    return DashboardStats(
        total_students=total_students,
        total_teachers=total_teachers,
        total_subjects=total_subjects,
        attendance_rate=round(attendance_rate, 2),
        low_attendance_count=low_attendance_count,
    )


@app.post("/notifications/low-attendance")
def send_low_attendance_notifications(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    students = db.query(Student, User).join(User, Student.user_id == User.id).all()
    notified = []
    for student, user in students:
        records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        total = len(records)
        present = len([r for r in records if r.status == "Present"])
        rate = (present / total * 100) if total else 0
        if rate < 75:
            notified.append(user.email)
    return {"message": "Email notifications simulated", "recipients": notified}


@app.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Teachers can update student records only.
    if current_user.role == "teacher" and user.role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only update students")
    if current_user.role == "teacher" and payload.role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only assign student role")

    user.name = payload.name
    user.email = payload.email
    user.role = payload.role
    if payload.password:
        user.password = hash_password(payload.password)

    student = db.query(Student).filter(Student.user_id == user.id).first()
    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()

    if payload.role == "student":
        student_class = payload.student_class or (student.student_class if student else None)
        student_year = payload.year or (student.year if student else "Year 1")
        student_prn = payload.prn or (student.prn if student else None)
        student_birth_date = payload.birth_date if payload.birth_date is not None else (student.birth_date if student else None)
        student_address = payload.address if payload.address is not None else (student.address if student else None)

        if not student_class:
            raise HTTPException(status_code=400, detail="student_class is required")
        ensure_class_exists(db, student_class)
        if not student_prn:
            raise HTTPException(status_code=400, detail="prn is required")

        if student:
            student.student_class = student_class
            student.year = student_year
            student.prn = student_prn
            student.birth_date = student_birth_date
            student.address = student_address
        else:
            db.add(
                Student(
                    user_id=user.id,
                    student_class=student_class,
                    year=student_year,
                    prn=student_prn,
                    birth_date=student_birth_date,
                    address=student_address,
                )
            )
        if teacher:
            db.delete(teacher)
    elif payload.role == "teacher":
        teacher_subject = payload.subject or (teacher.subject if teacher else None)
        teacher_class_name = payload.class_name if payload.class_name is not None else (teacher.class_name if teacher else None)
        if not teacher_subject:
            raise HTTPException(status_code=400, detail="subject is required")
        if teacher_class_name:
            ensure_class_exists(db, teacher_class_name)
        if teacher:
            teacher.subject = teacher_subject
            teacher.class_name = teacher_class_name
        else:
            db.add(Teacher(user_id=user.id, subject=teacher_subject, class_name=teacher_class_name))
        if student:
            db.delete(student)
    else:
        if student:
            db.delete(student)
        if teacher:
            db.delete(teacher)
    db.commit()
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role)


@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Teachers can delete student records only.
    if current_user.role == "teacher" and user.role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only delete students")

    student = db.query(Student).filter(Student.user_id == user.id).first()
    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()

    if student:
        db.query(Attendance).filter(Attendance.student_id == student.id).delete()
        db.delete(student)
    if teacher:
        db.delete(teacher)

    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
