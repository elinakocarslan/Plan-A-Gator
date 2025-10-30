from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    college = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    schedules = db.relationship('UserSchedule', backref='user', lazy=True, cascade='all, delete-orphan')
    completed_courses = db.relationship('UserCompletedCourse', backref='user', lazy=True)

class Course(db.Model):
    __tablename__ = 'courses'
    course_id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(20), unique=True, nullable=False)
    course_name = db.Column(db.String(200))
    credits = db.Column(db.Integer, default=3)
    professor = db.Column(db.String(100))
    description = db.Column(db.Text)
    prerequisites = db.Column(db.String(500))
    
    # Relationships
    schedule_entries = db.relationship('ScheduleCourse', backref='course', lazy=True)

class UserCompletedCourse(db.Model):
    __tablename__ = 'user_completed_courses'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    grade = db.Column(db.String(5))
    semester = db.Column(db.String(20))
    year = db.Column(db.Integer)

class UserSchedule(db.Model):
    __tablename__ = 'user_schedules'
    schedule_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    courses = db.relationship('ScheduleCourse', backref='schedule', lazy=True, cascade='all, delete-orphan')

class ScheduleCourse(db.Model):
    __tablename__ = 'schedule_courses'
    id = db.Column(db.Integer, primary_key=True)
    schedule_id = db.Column(db.Integer, db.ForeignKey('user_schedules.schedule_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # Monday, Tuesday, etc.
    start_time = db.Column(db.String(10), nullable=False)   # "9:00 AM", etc.