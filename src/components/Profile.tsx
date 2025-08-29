import React, { useState, useEffect } from 'react';
import './Profile.css';

interface User {
  id?: number;
  name: string;
  age: number;
  height: number;
  weight: number;
  goal: string;
  experience_level: string;
  units: string;
}

interface WeightLog {
  id: number;
  user_id: number;
  weight: number;
  date: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User>({
    name: '',
    age: 0,
    height: 0,
    weight: 0,
    goal: 'lose_weight',
    experience_level: 'beginner',
    units: 'metric'
  });
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId] = useState(1); // For demo, using fixed user ID

  useEffect(() => {
    fetchUser();
    fetchWeightLogs();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchWeightLogs = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/weight-logs/${userId}`);
      if (response.ok) {
        const logs = await response.json();
        setWeightLogs(logs);
      }
    } catch (error) {
      console.error('Error fetching weight logs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const method = user.id ? 'PUT' : 'POST';
      const url = user.id 
        ? `http://localhost:5000/api/users/${user.id}`
        : 'http://localhost:5000/api/users';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!user.id) {
          setUser({ ...user, id: result.id });
        }
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !user.id) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/weight-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          weight: parseFloat(newWeight),
          date: new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        setNewWeight('');
        fetchWeightLogs();
        setUser({ ...user, weight: parseFloat(newWeight) });
      }
    } catch (error) {
      console.error('Error adding weight log:', error);
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-header">👤 PROFILE</h2>
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-form-group">
          <label className="profile-label">Name:</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            required
            className="profile-input"
          />
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">Age:</label>
          <input
            type="number"
            value={user.age || ''}
            onChange={(e) => setUser({ ...user, age: parseInt(e.target.value) || 0 })}
            className="profile-input"
          />
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">Height ({user.units === 'metric' ? 'cm' : 'inches'}):</label>
          <input
            type="number"
            step="0.1"
            value={user.height || ''}
            onChange={(e) => setUser({ ...user, height: parseFloat(e.target.value) || 0 })}
            className="profile-input"
          />
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">Weight ({user.units === 'metric' ? 'kg' : 'lbs'}):</label>
          <input
            type="number"
            step="0.1"
            value={user.weight || ''}
            onChange={(e) => setUser({ ...user, weight: parseFloat(e.target.value) || 0 })}
            className="profile-input"
          />
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">Goal:</label>
          <select
            value={user.goal}
            onChange={(e) => setUser({ ...user, goal: e.target.value })}
            className="profile-input"
          >
            <option value="lose_weight">Lose Weight</option>
            <option value="gain_weight">Gain Weight</option>
            <option value="maintain_weight">Maintain Weight</option>
            <option value="build_muscle">Build Muscle</option>
          </select>
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">Experience Level:</label>
          <select
            value={user.experience_level}
            onChange={(e) => setUser({ ...user, experience_level: e.target.value })}
            className="profile-input"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">Units:</label>
          <select
            value={user.units}
            onChange={(e) => setUser({ ...user, units: e.target.value })}
            className="profile-input"
          >
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lbs, inches)</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading} className="gym-button">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
      
      {user.id && (
        <>
          <h3 className="profile-section-header">Update Weight</h3>
          <form onSubmit={handleWeightUpdate} className="profile-form">
            <div className="profile-form-group-inline">
              <div className="profile-flex-1">
                <label className="profile-label">New Weight ({user.units === 'metric' ? 'kg' : 'lbs'}):</label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  required
                  className="profile-input"
                />
              </div>
              <button type="submit" className="gym-button profile-button-small">
                Add Entry
              </button>
            </div>
          </form>
          
          <h3 className="profile-section-header-orange">Weight History</h3>
          <div className="gym-card profile-weight-history">
            {weightLogs.length === 0 ? (
              <p className="profile-no-data">No weight entries yet.</p>
            ) : (
              <ul className="profile-weight-logs">
                {weightLogs.map((log) => (
                  <li key={log.id} className="profile-weight-log-item">
                    <strong>{log.weight} {user.units === 'metric' ? 'kg' : 'lbs'}</strong> - {log.date}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;