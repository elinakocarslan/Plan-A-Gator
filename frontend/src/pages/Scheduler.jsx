import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from "react";
import { Button, Card, CardBody, Container, Section, Alert, LoadingSpinner, Badge } from "../components/UIComponents";
import "./Scheduler.css";

export default function Scheduler() {
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [courseCategories, setCourseCategories] = useState({
    "Core Classes": [],
    "Technical Electives": [],
    "General Education": []
  });
  const [courseInfo, setCourseInfo] = useState({});
  const [loadingCourseInfo, setLoadingCourseInfo] = useState(new Set());
  const [activeInfoCard, setActiveInfoCard] = useState(null);
  const scheduleRef = useRef(null);

  // saved schedule variables
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = ["8:30 AM", "9:35 AM", "10:40 AM", "11:45 AM", "12:50 PM", 
                 "1:55 PM", "2:55 PM", "3:55 PM", "4:55 PM", "5:55 PM"];

  

  // Helper function to generate random times for courses
  const generateRandomTime = () => {
    const patterns = [
      { days: ["Monday", "Wednesday", "Friday"], duration: 0.50 }, // MWF 1 hour
      { days: ["Tuesday", "Thursday"], duration: 1.50 }, // TR 1.25 hours
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const startTimeIndex = Math.floor(Math.random() * (times.length - 2));
    const startTime = times[startTimeIndex];
    
    return {
      days: pattern.days,
      startTime: startTime,
      duration: pattern.duration
    };
  };

  // Function to fetch course information
  const fetchCourseInfo = async (courseCode) => {
    if (courseInfo[courseCode] || loadingCourseInfo.has(courseCode)) {
      return;
    }

    setLoadingCourseInfo(prev => new Set(prev).add(courseCode));

    try {
      const response = await fetch(`http://127.0.0.1:5000/get-course-info/${courseCode}`);
      const data = await response.json();
      
      if (data.success) {
        setCourseInfo(prev => ({
          ...prev,
          [courseCode]: data.course_info
        }));
      }
    } catch (error) {
      console.error('Error fetching course info:', error);
    } finally {
      setLoadingCourseInfo(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseCode);
        return newSet;
      });
    }
  };

  // Modified useEffect to include course info fetching
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const user_id = localStorage.getItem('user_id');
        const classes = localStorage.getItem('parsed_classes') || '';
        console.log('Fetching recommendations for user:', user_id);
        
        const response = await fetch(`http://127.0.0.1:5000/get-course-recommendations?user_id=${user_id}&classes=${classes}`);
        const data = await response.json();
        console.log('Received data:', data);
        
        if (response.ok) {
          if (!data.recommendations) {
            console.error('No recommendations in response');
            return;
          }

          const formattedCourses = {
            "Core Classes": (data.recommendations.Core || []).map(code => {
              const timeInfo = generateRandomTime();
              fetchCourseInfo(code);
              return {
                code,
                name: `Course ${code}`,
                credits: 3,
                instructor: "TBD",
                timeInfo,
                time: `${timeInfo.days.map(d => d.slice(0, 2)).join('')} ${timeInfo.startTime}`,
                category: "core"
              };
            }),
            "Technical Electives": (data.recommendations["Elective/eligible"] || []).map(code => {
              const timeInfo = generateRandomTime();
              fetchCourseInfo(code);
              return {
                code,
                name: `Course ${code}`,
                credits: 3,
                instructor: "TBD",
                timeInfo,
                time: `${timeInfo.days.map(d => d.slice(0, 2)).join('')} ${timeInfo.startTime}`,
                category: "elective"
              };
            }),
            "General Education": (data.recommendations.GenEd || []).map(code => {
              const timeInfo = generateRandomTime();
              fetchCourseInfo(code);
              return {
                code,
                name: `Course ${code}`,
                credits: 3,
                instructor: "TBD",
                timeInfo,
                time: `${timeInfo.days.map(d => d.slice(0, 2)).join('')} ${timeInfo.startTime}`,
                category: "gened"
              };
            })
          };

          console.log('Formatted courses:', formattedCourses);
          setCourseCategories(formattedCourses);
        } else {
          console.error('Failed to fetch recommendations:', data.error);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      }
    };
    
    fetchRecommendations();
  }, [localStorage.getItem('parsed_classes')]);

  const handleDragStart = (course) => {
    setDraggedCourse(course);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const addCourseToSchedule = (course) => {
    const newSchedule = { ...schedule };
    const { days: courseDays, startTime } = course.timeInfo;
    
    // Find the time index
    const timeIndex = times.indexOf(startTime);
    
    if (timeIndex !== -1) {
      courseDays.forEach(day => {
        const key = `${day}-${startTime}`;
        const instanceId = `${course.code}-${day}-${startTime}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
        newSchedule[key] = { ...course, instanceId, scheduledDay: day, scheduledTime: startTime };
      });
      
      setSchedule(newSchedule);
    }
  };

  const handleCourseClick = (course) => {
    addCourseToSchedule(course);
  };

  const handleInfoClick = (course, e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveInfoCard(course.code);
    // Fetch course info if not already loaded
    fetchCourseInfo(course.code);
  };

  const handleCloseInfoCard = (e) => {
    e.stopPropagation();
    setActiveInfoCard(null);
  };

  const handleDrop = (day, time) => {
    if (!draggedCourse) return;
    const key = `${day}-${time}`;
    setSchedule(prev => {
      const instanceId = `${draggedCourse.code}-${day}-${time}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      return {
        ...prev,
        [key]: { ...draggedCourse, instanceId, scheduledDay: day, scheduledTime: time }
      };
    });
    setDraggedCourse(null);
  };

  const handleRemoveCourse = (instanceId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setSchedule(prev => {
      const newSchedule = { ...prev };
      const courseToRemove = Object.values(newSchedule).find(
        item => item.instanceId === instanceId
      );

      if (!courseToRemove) {
        console.warn("Could not find course for instanceId", instanceId);
        return prev;
      }

      // match all blocks that have the same course code (and optional start time)
      const { code, timeInfo } = courseToRemove;
      const startTime = timeInfo?.startTime || courseToRemove.scheduledTime;

      Object.keys(newSchedule).forEach(key => {
        const item = newSchedule[key];
        if (!item) return;

        if (
          item.code === code &&
          (item.timeInfo?.startTime === startTime ||
          item.scheduledTime === startTime)
        ) {
          delete newSchedule[key];
        }
      });

      return newSchedule;
    });
  };

  const handleClearSchedule = () => {
    setSchedule({});
  };

  const handleSaveSchedule = async () => {
    if (!scheduleName.trim()) {
        alert("Please enter a name for your schedule");
        return;
    }

    try {
        // Create canvas from the schedule element
        if (!scheduleRef.current) {
            throw new Error('Schedule element not found');
        }

        const canvas = await html2canvas(scheduleRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        // Create PDF
        const pdfWidth = 210;
        const pdfHeight = 297;
        const aspectRatio = canvas.height / canvas.width;
        const imgWidth = pdfWidth - 20;
        const imgHeight = imgWidth * aspectRatio;

        const pdf = new jsPDF({
            orientation: imgHeight > pdfWidth ? 'portrait' : 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        pdf.setFontSize(16);
        pdf.text('Weekly Schedule', pdfWidth / 2, 15, { align: 'center' });

        pdf.addImage(
            canvas.toDataURL('image/jpeg', 1.0),
            'JPEG',
            10,
            25,
            imgWidth,
            imgHeight
        );

        pdf.setFontSize(12);
        const bottomY = Math.min(imgHeight + 35, pdfHeight - 15);
        pdf.text(`Total Courses: ${countUniqueCourses()}`, 10, bottomY);
        pdf.text(`Total Credits: ${calculateTotalCredits()}`, 10, bottomY + 7);

        pdf.save(`${scheduleName}-${new Date().toISOString().split('T')[0]}.pdf`);

        // Save schedule to state
        const newSchedule = {
            id: Date.now(),
            name: scheduleName,
            schedule: { ...schedule },
            credits: calculateTotalCredits(),
            courses: countUniqueCourses(),
            priority: savedSchedules.length + 1
        };

        setSavedSchedules(prev => [...prev, newSchedule]);
        setScheduleName("");

    } catch (error) {
        console.error('Error saving schedule:', error);
        alert(`Failed to generate PDF: ${error.message}`);
    }
};

const handleScheduleClick = (savedSchedule, event) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    
    setModalPosition({
        top: rect.top,
        left: rect.left
    });
    setSelectedSchedule(savedSchedule);
    setShowModal(true);
};

const handleLoadSchedule = () => {
    if (selectedSchedule) {
        setSchedule(selectedSchedule.schedule);
        setShowModal(false);
    }
};

const handlePriorityChange = (scheduleId, direction) => {
    setSavedSchedules(prev => {
        const schedules = [...prev];
        const index = schedules.findIndex(s => s.id === scheduleId);
        if (direction === 'up' && index > 0) {
            [schedules[index], schedules[index - 1]] = [schedules[index - 1], schedules[index]];
        } else if (direction === 'down' && index < schedules.length - 1) {
            [schedules[index], schedules[index + 1]] = [schedules[index + 1], schedules[index]];
        }
        return schedules.map((s, i) => ({ ...s, priority: i + 1 }));
    });
};

  const calculateTotalCredits = () => {
    const uniqueCourses = new Set();
    Object.values(schedule).forEach(course => {
      uniqueCourses.add(course.code);
    });
    
    let totalCredits = 0;
    uniqueCourses.forEach(courseCode => {
      const course = Object.values(schedule).find(c => c.code === courseCode);
      if (course) {
        totalCredits += courseInfo[courseCode]?.credits || course.credits;
      }
    });
    
    return totalCredits;
  };

  const countUniqueCourses = () => {
    const uniqueCourses = new Set();
    Object.values(schedule).forEach(course => {
      uniqueCourses.add(course.code);
    });
    return uniqueCourses.size;
  };

  const filteredCategories = Object.entries(courseCategories).reduce(
    (acc, [category, courses]) => {
      const filteredCourses = courses.filter(course =>
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      acc[category] = filteredCourses;
      return acc;
    },
    {}
  );

  const navigate = useNavigate();
  const handleUpdateTranscript = async () => {
  setCourseCategories({
    "Core Classes": [],
    "Technical Electives": [],
    "General Education": []
  });

  setSchedule({});

  localStorage.removeItem('parsed_classes');

  navigate("/transcript");
  }

  return (
    <div className="scheduler-page">
      <div className="scheduler-container">
        {/* Left Sidebar - Available Courses */}
          <div className="sidebar-layout">
            <div className="top-sidebar">
              <div className="courses-sidebar">
              <div className="transcript-row">
                <span className="upload-text">Want to upload a new transcript?</span>
                <button className="btn-transcript" onClick={handleUpdateTranscript}>
                  Update Transcript
                </button>
              </div>
            </div>
            </div>
            <div className="courses-sidebar">
            <h2>Available Courses</h2>  
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {Object.entries(filteredCategories).map(([category, courses]) => (
  <div key={category} className="course-category">
    <div className="category-title">{category}</div>
    <div className="course-list">
      {courses.map((course) => (
        <div
          key={course.code}
          className={`course-card ${category === "Core Classes" 
            ? "core" 
            : category === "Technical Electives" 
            ? "elective" 
            : "gened"}`}
          draggable
          onDragStart={() => handleDragStart(course)}
          onClick={() => handleCourseClick(course)}
        >
          <div className="course-code">
            <span>{course.code}</span>
            <div
              className="info-icon"
              onMouseEnter={(e) => {
                e.stopPropagation();
                fetchCourseInfo(course.code);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveInfoCard(course.code);
                fetchCourseInfo(course.code);
              }}
            >
              i
              <div className="info-tooltip">
                <div className="tooltip-title">{course.code}</div>
                <div className="tooltip-content">
                  <div className="tooltip-row">
                    <span className="tooltip-label">Name: </span>{course.name}
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Credits: </span>{course.credits}
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Instructor: </span>{course.instructor}
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Time: </span>{course.time}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="course-name">
            {courseInfo[course.code]?.name || course.name}
          </div>
          <div className="course-credits">
            {courseInfo[course.code]?.credits || course.credits} credits • {course.time}
          </div>
        </div>
      ))}
    </div>
  </div>
))}

          </div>
          </div>
          

        {/* Right Side - Weekly Schedule */}
        <div className="schedule-area" ref={scheduleRef}>
          <div className="schedule-header">
            <h2>Weekly Schedule</h2>
            <div className="schedule-actions">
              <button className="btn-clear" onClick={handleClearSchedule}>
                Clear Schedule
              </button>
{/*               <button className="btn-save" onClick={handleSaveSchedule}>
                Save Schedule
              </button> */}
            </div>
          </div>

          <div className="schedule-grid">
            {/* Top-left corner */}
            <div className="time-header">Time</div>

            {/* Day headers */}
            {days.map((day) => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}

            {/* Time slots and schedule cells */}
            {times.map((time) => (
              <React.Fragment key={time}>
                <div className="time-slot">
                  {time}
                </div>
                {days.map((day) => {
                  const key = `${day}-${time}`;
                  const course = schedule[key];
                  
                  return (
                    <div
                      key={key}
                      className="schedule-cell"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day, time)}
                    >
                      {course && (
  <div
    className={`scheduled-course ${course.category}`}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: `${(course.duration || 1) * 80}px`, // dynamic height
      zIndex: 10, // ensures it floats above the grid
    }}
  >
    <button
      className="remove-course"
      onClick={(e) => handleRemoveCourse(course.code, e)}
    >
      ×
    </button>
    <div>
      <div className="course-code">{course.code}</div>
      <div className="course-name">
        {courseInfo[course.code]?.name || course.name}
      </div>
      <div className="course-instructor">
        {courseInfo[course.code]?.instructor || course.instructor}
      </div>
    </div>
  </div>
)}


                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Total Credits Section */}
          <div className="total-credits">
            <div>
              <div className="total-credits-label">Schedule Summary</div>
              <div className="credits-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-value">{countUniqueCourses()}</span>
                  <span className="breakdown-label">Courses</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-value">{calculateTotalCredits()}</span>
                  <span className="breakdown-label">Credits</span>
                </div>
              </div>
            </div>
            <div className="total-credits-value">{calculateTotalCredits()} Credits</div>
          </div>
        </div>
        {/* Saved Schedules Section */}
        <div className="saved-schedules-section">
            <h3>Saved Schedules</h3>
            <div className="schedule-input-group">
                <input
                    type="text"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder="Enter schedule name..."
                    className="schedule-name-input"
                />
                <button className="btn-save" onClick={handleSaveSchedule}>
                    Save Current Schedule
                </button>
            </div>
            <div className="saved-schedules-container">
                {savedSchedules.map((schedule) => (
                    <div
                        key={schedule.id}
                        className="saved-schedule-card"
                        onClick={(event) => handleScheduleClick(schedule, event)}
                    >
                        <div className="priority-badge">#{schedule.priority}</div>
                        <h4>{schedule.name}</h4>
                        <p>{schedule.courses} Courses</p>
                        <p>{schedule.credits} Credits</p>
                        <div className="priority-controls">
                            <button
                                className="priority-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePriorityChange(schedule.id, 'up');
                                }}
                            >
                                ↑
                            </button>
                            <button
                                className="priority-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePriorityChange(schedule.id, 'down');
                                }}
                            >
                                ↓
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Schedule Modal */}
        {showModal && selectedSchedule && (
            <div className="schedule-modal-overlay" onClick={() => setShowModal(false)}>
                <div 
                    className="schedule-modal-content" 
                    onClick={e => e.stopPropagation()}
                >
                    <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                    <h2>{selectedSchedule.name}</h2>
                    <div className="modal-schedule-preview">
                        <div className="preview-stats">
                            <p>Total Courses: {selectedSchedule.courses}</p>
                            <p>Total Credits: {selectedSchedule.credits}</p>
                            
                            <div className="course-list">
                                {Object.values(selectedSchedule.schedule)
                                    .filter((course, index, self) => 
                                        index === self.findIndex(c => c.code === course.code)
                                    )
                                    .map((course, index) => (
                                        <div key={index} className="modal-course-item">
                                            <span className="modal-course-name">{course.name}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <button className="load-schedule-btn" onClick={handleLoadSchedule}>
                            Load This Schedule
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Info Card Modal */}
      {activeInfoCard && (
        <div className="info-card-overlay" onClick={handleCloseInfoCard}>
          <div className="info-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-card-header">
              <h3>{activeInfoCard}</h3>
              <button className="info-card-close" onClick={handleCloseInfoCard}>
                ×
              </button>
            </div>
            <div className="info-card-content">
              {courseInfo[activeInfoCard] ? (
                <>
                  <div className="info-section">
                    <div className="info-label">Course Name</div>
                    <div className="info-value">{courseInfo[activeInfoCard].name}</div>
                  </div>
                  
                  <div className="info-section">
                    <div className="info-label">Credits</div>
                    <div className="info-value">{courseInfo[activeInfoCard].credits}</div>
                  </div>
                  
                  <div className="info-section">
                    <div className="info-label">Grading Scheme</div>
                    <div className="info-value">{courseInfo[activeInfoCard].grading_scheme || "Letter Grade"}</div>
                  </div>
                  
                  <div className="info-section">
                    <div className="info-label">Instructor</div>
                    <div className="info-value">{courseInfo[activeInfoCard].instructor || "TBD"}</div>
                  </div>
                  
                  <div className="info-section">
                    <div className="info-label">Description</div>
                    <div className="info-value description">
                      {courseInfo[activeInfoCard].description || "No description available."}
                    </div>
                  </div>
                  
                  {courseInfo[activeInfoCard].prerequisites && (
                    <div className="info-section">
                      <div className="info-label">Prerequisites</div>
                      <div className="info-value">
                        {courseInfo[activeInfoCard].prerequisites}
                      </div>
                    </div>
                  )}
                  
                  {courseInfo[activeInfoCard].syllabus_url && (
                    <div className="info-section">
                      <div className="info-label">Syllabus</div>
                      <div className="info-value">
                        <a 
                          href={courseInfo[activeInfoCard].syllabus_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="syllabus-link-large"
                        >
                          View Course Syllabus →
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : loadingCourseInfo.has(activeInfoCard) ? (
                <div className="loading-info">
                  <div className="loading-spinner"></div>
                  <div>Loading course information...</div>
                </div>
              ) : (
                <div className="info-section">
                  <div className="info-value">Course information not available.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}