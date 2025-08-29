import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Progress.css';

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
}

interface ExerciseProgress {
  date: string;
  max_weight: number;
  volume: number;
}

interface BodyWeightData {
  date: string;
  weight: number;
}

interface WorkoutFrequency {
  week: string;
  workout_count: number;
}

const Progress: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [bodyWeightData, setBodyWeightData] = useState<BodyWeightData[]>([]);
  const [workoutFrequency, setWorkoutFrequency] = useState<WorkoutFrequency[]>([]);
  const [activeTab, setActiveTab] = useState('exercise');
  const [userId] = useState(1);

  useEffect(() => {
    fetchExercises();
    fetchBodyWeightData();
    fetchWorkoutFrequency();
  }, []);

  useEffect(() => {
    if (selectedExerciseId) {
      fetchExerciseProgress(selectedExerciseId);
    }
  }, [selectedExerciseId]);

  const fetchExercises = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/exercises');
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
        if (data.length > 0) {
          setSelectedExerciseId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchExerciseProgress = async (exerciseId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/progress/exercise/${exerciseId}`);
      if (response.ok) {
        const data = await response.json();
        setExerciseProgress(data);
      }
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
    }
  };

  const fetchBodyWeightData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/progress/bodyweight/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBodyWeightData(data);
      }
    } catch (error) {
      console.error('Error fetching bodyweight data:', error);
    }
  };

  const fetchWorkoutFrequency = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/progress/workouts/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkoutFrequency(data.map((item: any) => ({
          ...item,
          week: `Week ${item.week.split('-')[1]}`
        })));
      }
    } catch (error) {
      console.error('Error fetching workout frequency:', error);
    }
  };

  const renderExerciseProgress = () => (
    <div>
      <div className="progress-form-group">
        <label className="progress-label">Select Exercise:</label>
        <select
          value={selectedExerciseId || ''}
          onChange={(e) => setSelectedExerciseId(parseInt(e.target.value))}
          className="progress-input"
        >
          {exercises.map(exercise => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name} ({exercise.muscle_group})
            </option>
          ))}
        </select>
      </div>

      {exerciseProgress.length > 0 ? (
        <div>
          <h4 className="progress-section-header-green">Max Weight Progress</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={exerciseProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="max_weight" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>

          <h4 className="progress-section-header-orange">Volume Progress</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={exerciseProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="progress-no-data">No progress data available for this exercise.</p>
      )}
    </div>
  );

  const renderBodyWeightProgress = () => (
    <div>
      <h4 className="progress-section-header-pink">Body Weight Tracking</h4>
      {bodyWeightData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={bodyWeightData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="weight" stroke="#ff7300" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="progress-no-data">No body weight data available. Add weight entries in your profile.</p>
      )}
    </div>
  );

  const renderWorkoutAnalytics = () => (
    <div>
      <h4 className="progress-section-header-purple">Weekly Workout Frequency</h4>
      {workoutFrequency.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={workoutFrequency}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="workout_count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="progress-no-data">No workout data available. Complete some workouts to see analytics.</p>
      )}
    </div>
  );

  return (
    <div className="progress-container">
      <h1 className="progress-header">📈 PROGRESS TRACKING</h1>

      {/* Tab Navigation */}
      <div className="progress-tab-container">
        <div className="progress-tab-nav">
          <button
            onClick={() => setActiveTab('exercise')}
            className="nav-button"
            style={{
              backgroundColor: activeTab === 'exercise' ? 'linear-gradient(45deg, #39ff14, #00ffff)' : 'linear-gradient(45deg, #1a1a2e, #16213e)',
              color: activeTab === 'exercise' ? '#000000' : '#ffffff'
            }}
          >
            Exercise Progress
          </button>
          <button
            onClick={() => setActiveTab('bodyweight')}
            className="nav-button"
            style={{
              backgroundColor: activeTab === 'bodyweight' ? 'linear-gradient(45deg, #39ff14, #00ffff)' : 'linear-gradient(45deg, #1a1a2e, #16213e)',
              color: activeTab === 'bodyweight' ? '#000000' : '#ffffff'
            }}
          >
            Body Weight
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className="nav-button"
            style={{
              backgroundColor: activeTab === 'analytics' ? 'linear-gradient(45deg, #39ff14, #00ffff)' : 'linear-gradient(45deg, #1a1a2e, #16213e)',
              color: activeTab === 'analytics' ? '#000000' : '#ffffff'
            }}
          >
            Workout Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="gym-card">
        {activeTab === 'exercise' && renderExerciseProgress()}
        {activeTab === 'bodyweight' && renderBodyWeightProgress()}
        {activeTab === 'analytics' && renderWorkoutAnalytics()}
      </div>
    </div>
  );
};

export default Progress;