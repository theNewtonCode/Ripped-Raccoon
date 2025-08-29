import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Routines from './components/Routines';
import WorkoutSession from './components/WorkoutSession';
import Progress from './components/Progress';
import Settings from './components/Settings';
import logo from './images/Logo_RR.png';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [username] = useState('Fitness Warrior'); // You can get this from user profile later

  const renderView = () => {
    switch (currentView) {
      case 'profile':
        return <Profile />;
      case 'routines':
        return <Routines />;
      case 'workout':
        return <WorkoutSession />;
      case 'progress':
        return <Progress />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="App">
      <header className="gym-header">
        <div className="gym-logo-section" onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Ripped Raccoon" className="gym-logo" style={{ borderRadius: '50%' }} />
          <div className="gym-branding">
            <h1 className="gym-title">RIPPED RACCOON</h1>
            <p className="gym-tagline">UNLEASH THE BEAST WITHIN</p>
          </div>
        </div>
      </header>
      
      <nav className="gym-nav">
        <button 
          onClick={() => setCurrentView('dashboard')} 
          className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
        >
          🏠 Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('profile')} 
          className={`nav-button ${currentView === 'profile' ? 'active' : ''}`}
        >
          👤 Profile
        </button>
        <button 
          onClick={() => setCurrentView('routines')} 
          className={`nav-button ${currentView === 'routines' ? 'active' : ''}`}
        >
          📋 Routines
        </button>
        <button 
          onClick={() => setCurrentView('workout')} 
          className={`nav-button ${currentView === 'workout' ? 'active' : ''}`}
        >
          💪 Workout
        </button>
        <button 
          onClick={() => setCurrentView('progress')} 
          className={`nav-button ${currentView === 'progress' ? 'active' : ''}`}
        >
          📈 Progress
        </button>
        <button 
          onClick={() => setCurrentView('settings')} 
          className={`nav-button ${currentView === 'settings' ? 'active' : ''}`}
        >
          ⚙️ Settings
        </button>
      </nav>
      
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="gym-card"
            style={{
              padding: '30px',
              textAlign: 'center',
              maxWidth: '400px',
              background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
              border: '2px solid #00ffff',
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#39ff14', textShadow: '0 0 15px rgba(57, 255, 20, 0.8)', marginBottom: '20px' }}>
              👋 Hey {username}!
            </h2>
            <p style={{ color: '#ffffff', fontSize: '18px', lineHeight: '1.6' }}>
              This app is created by <span style={{ color: '#00ffff', fontWeight: 'bold', textShadow: '0 0 10px rgba(0, 255, 255, 0.8)' }}>Abhyuday</span> for you!
            </p>
            <button 
              onClick={() => setShowModal(false)}
              className="gym-button"
              style={{ marginTop: '20px', backgroundColor: '#39ff14', color: '#000000' }}
            >
              ✨ Awesome!
            </button>
          </div>
        </div>
      )}
      
      <main style={{ padding: '20px' }}>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
