from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from course_scraper import get_course_info
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from models import db, User, Course, UserCompletedCourse, UserSchedule, ScheduleCourse
import os
from sqlalchemy.exc import IntegrityError
import re
from recommendation_services import recommend_courses

# Load .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # allows frontend (React) to talk to backend 

# Database configuration (PostgreSQL)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)   # this initializes SQLAlchemy after app is created
bcrypt = Bcrypt(app)
#

with app.app_context():
    db.create_all()

app.secret_key = os.getenv("SECRET_KEY")

@app.route("/")
def index():
    return "Welcome to Plan A Gator Flask backend!"

@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify(message="Hello from Flask!")

@app.route("/api/upload", methods=["POST"])
def upload_transcript():
    file = request.files.get("file")
    if not file:
        return jsonify(error="No file uploaded"), 400
    # TODO: parse transcript here
    return jsonify(message="Transcript received!")

#wire course recommendations to backend
@app.route('/get-course-recommendations', methods=['GET'])
def get_recommendations():
    user_id = request.args.get('user_id')
    classes = request.args.get('classes', '')

    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    print("college" + user.college)
    completed_courses = [c.strip().upper() for c in classes.split(',') if c.strip()]

    # Get recommendations using your service
    recommendations = recommend_courses(
        college=user.college,
        transcipt_codes=completed_courses
    )
    
    # Fetch additional course details from your database
    # for category in recommendations:
    #     for i, code in enumerate(recommendations[category]):
    #         course = Course.query.filter_by(course_code=code).first()
    #         if course:
    #             recommendations[category][i] = {
    #                 'code': code,
    #                 'name': course.course_name,
    #                 'credits': course.credits,
    #                 'instructor': course.professor,
    #                 'time': 'TBD'  # Add this to your Course model if needed
    #             }
    print("Recommendations:", recommendations)
    
    return jsonify({'recommendations': recommendations})

# Real database routes
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        username=data['username'],
        password_hash=hashed_pw,
        email=data.get('email'),
    )
    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        # likely a unique constraint violation (username/email already exists)
        return jsonify({'error': 'User creation failed: User already exists', 'details': str(e.orig)}), 400
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Unexpected database error', 'details': str(e)}), 500

    return jsonify({'message': 'User created successfully', 'user_id': new_user.user_id}), 201

@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and bcrypt.check_password_hash(user.password_hash, data.get('password')):
        return jsonify({'message': 'Login successful', 'user_id': user.user_id})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/update-user-info', methods=['POST'])
def update_user_info():
    data = request.get_json()
    user_id = data.get('user_id')
    grade = data.get('grade')
    college = data.get('college')

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.grade = grade
    user.college = college
    db.session.commit()
    return jsonify({'message': 'User info updated successfully'})

#code to save schedule to database
# Add these routes to your app.py

@app.route('/save-schedule', methods=['POST'])
def save_schedule():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        schedule_name = data.get('name')
        schedule_data = data.get('schedule')  # The schedule object from frontend
        
        print(f"Debug - Saving schedule: user_id={user_id}, name={schedule_name}")
        print(f"Debug - Schedule data keys: {list(schedule_data.keys()) if schedule_data else 'None'}")
        
        if not user_id or not schedule_name or not schedule_data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new schedule
        new_schedule = UserSchedule(
            user_id=user_id,
            name=schedule_name
        )
        db.session.add(new_schedule)
        db.session.flush()  # Get the schedule_id
        
        print(f"Debug - Created schedule with ID: {new_schedule.schedule_id}")
        
        # Save each course in the schedule
        for time_slot, course_data in schedule_data.items():
            if course_data:  # If there's a course in this time slot
                print(f"Debug - Processing time slot: {time_slot}, course: {course_data.get('code')}")
                
                # Parse the time slot (e.g., "Monday-9:00 AM")
                try:
                    day, time = time_slot.split('-')
                except ValueError:
                    print(f"Warning - Invalid time slot format: {time_slot}")
                    continue
                
                # Find or create the course
                course = Course.query.filter_by(course_code=course_data['code']).first()
                if not course:
                    course = Course(
                        course_code=course_data['code'],
                        course_name=course_data.get('name', f"Course {course_data['code']}"),
                        credits=course_data.get('credits', 3),
                        professor=course_data.get('instructor', 'TBD')
                    )
                    db.session.add(course)
                    db.session.flush()
                    print(f"Debug - Created new course: {course.course_code}")
                
                # Create schedule course entry
                schedule_course = ScheduleCourse(
                    schedule_id=new_schedule.schedule_id,
                    course_id=course.course_id,
                    day_of_week=day,
                    start_time=time
                )
                db.session.add(schedule_course)
                print(f"Debug - Added schedule course: {course.course_code} on {day} at {time}")
        
        db.session.commit()
        print(f"Debug - Successfully saved schedule with {len([k for k, v in schedule_data.items() if v])} courses")
        
        return jsonify({
            'message': 'Schedule saved successfully',
            'schedule_id': new_schedule.schedule_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving schedule: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to save schedule: {str(e)}'}), 500
    
    
@app.route('/get-user-schedules/<int:user_id>', methods=['GET'])
def get_user_schedules(user_id):
    try:
        # Get all schedules for the user
        schedules = UserSchedule.query.filter_by(user_id=user_id).all()
        
        result = []
        for schedule in schedules:
            # Get courses for this schedule
            schedule_courses = db.session.query(ScheduleCourse, Course).join(
                Course, ScheduleCourse.course_id == Course.course_id
            ).filter(ScheduleCourse.schedule_id == schedule.schedule_id).all()
            
            # Reconstruct the schedule object
            schedule_data = {}
            total_credits = 0
            unique_courses = set()
            
            for sched_course, course in schedule_courses:
                time_slot = f"{sched_course.day_of_week}-{sched_course.start_time}"
                schedule_data[time_slot] = {
                    'code': course.course_code,
                    'name': course.course_name or f"Course {course.course_code}",
                    'credits': course.credits or 3,
                    'instructor': course.professor or 'TBD',
                    'time': sched_course.start_time
                }
                unique_courses.add(course.course_code)
                total_credits += course.credits or 3
            
            result.append({
                'id': schedule.schedule_id,
                'name': schedule.name,
                'schedule': schedule_data,
                'credits': total_credits,
                'courses': len(unique_courses),
                'created_at': schedule.created_at.isoformat() if schedule.created_at else None
            })
        
        return jsonify({'schedules': result})
        
    except Exception as e:
        print(f"Error getting user schedules: {str(e)}")
        return jsonify({'error': 'Failed to get schedules'}), 500

@app.route('/delete-schedule/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    try:
        schedule = UserSchedule.query.get(schedule_id)
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404
        
        # Delete associated schedule courses (should cascade automatically)
        db.session.delete(schedule)
        db.session.commit()
        
        return jsonify({'message': 'Schedule deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting schedule: {str(e)}")
        return jsonify({'error': 'Failed to delete schedule'}), 500

@app.route('/get-course-info/<course_code>', methods=['GET'])
def get_course_info_endpoint(course_code):
    try:
        course_info = get_course_info(course_code)
        
        return jsonify({
            'success': True,
            'course_info': course_info
        })
            
    except Exception as e:
        print(f"Error getting course info for {course_code}: {str(e)}")
        # Return basic info even if scraping fails
        return jsonify({
            'success': True,
            'course_info': {
                'code': course_code,
                'name': f"Course {course_code}",
                'credits': 3,
                'description': "Course information temporarily unavailable.",
                'prerequisites': "Check with academic advisor",
                'syllabus_url': None
            }
        })
    
if __name__ == "__main__":
    app.run(debug=os.getenv("DEBUG", "False") == "True")
