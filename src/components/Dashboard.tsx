import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface KPIs {
  totalWorkouts: number;
  workoutsThisWeek: number;
  averageWeeklyWorkouts: number;
  currentStreak: number;
  longestStreak: number;
}

interface LastWorkout {
  id: number;
  date: string;
  duration: number;
  routine_name: string;
  total_sets: number;
  total_volume: number;
}

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [lastWorkout, setLastWorkout] = useState<LastWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId] = useState(1);

  useEffect(() => {
    fetchKPIs();
    fetchLastWorkout();
  }, []);

  const fetchKPIs = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/summary/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setKpis(data);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLastWorkout = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/workouts/last/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLastWorkout(data);
      }
    } catch (error) {
      console.error('Error fetching last workout:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* KPI Cards */}
      <div className="dashboard-kpi-grid">
        <div className="gym-card dashboard-kpi-card dashboard-kpi-card-cyan">
          <h3>Current Streak</h3>
          <div className="kpi-value">
            {kpis?.currentStreak || 0}
          </div>
          <p>days</p>
        </div>
        
        <div className="gym-card dashboard-kpi-card dashboard-kpi-card-purple">
          <h3>Longest Streak</h3>
          <div className="kpi-value">
            {kpis?.longestStreak || 0}
          </div>
          <p>days</p>
        </div>
        
        <div className="gym-card dashboard-kpi-card dashboard-kpi-card-green">
          <h3>Total Workouts</h3>
          <div className="kpi-value">
            {kpis?.totalWorkouts || 0}
          </div>
          <p>completed</p>
        </div>
        
        <div className="gym-card dashboard-kpi-card dashboard-kpi-card-orange">
          <h3>This Week</h3>
          <div className="kpi-value">
            {kpis?.workoutsThisWeek || 0}
          </div>
          <p>workouts</p>
        </div>
        
        <div className="gym-card dashboard-kpi-card dashboard-kpi-card-pink">
          <h3>Weekly Average</h3>
          <div className="kpi-value">
            {kpis?.averageWeeklyWorkouts || 0}
          </div>
          <p>last 4 weeks</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="gym-card" style={{ marginBottom: '30px' }}>
        <h2 className="dashboard-section-header">Quick Actions</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('workout')}
            className="gym-button"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              flex: '1',
              minWidth: '200px'
            }}
          >
            🏋️ Start Today's Workout
          </button>
          
          <button
            onClick={() => {
              if (lastWorkout) {
                alert(`Last Workout Summary:\n\nRoutine: ${lastWorkout.routine_name}\nDate: ${lastWorkout.date}\nDuration: ${lastWorkout.duration} minutes\nSets: ${lastWorkout.total_sets}\nVolume: ${lastWorkout.total_volume} kg`);
              } else {
                alert('No completed workouts found.');
              }
            }}
            className="gym-button"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              flex: '1',
              minWidth: '200px'
            }}
          >
            📊 View Last Summary
          </button>
        </div>
      </div>

      {/* Last Workout Card */}
      {lastWorkout && (
        <div className="gym-card">
          <h3 className="dashboard-last-workout-header">Last Workout</h3>
          <div className="dashboard-workout-stats">
            <div>
              <p>Routine</p>
              <p>{lastWorkout.routine_name}</p>
            </div>
            <div>
              <p>Date</p>
              <p>{lastWorkout.date}</p>
            </div>
            <div>
              <p>Duration</p>
              <p>{lastWorkout.duration} min</p>
            </div>
            <div>
              <p>Sets</p>
              <p>{lastWorkout.total_sets}</p>
            </div>
            <div>
              <p>Volume</p>
              <p>{lastWorkout.total_volume} kg</p>
            </div>
          </div>
        </div>
      )}

      {!lastWorkout && (
        <div className="gym-card dashboard-no-workouts">
          <p>No completed workouts yet. Start your first workout to see your progress!</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;