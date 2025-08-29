import React, { useState, useEffect } from 'react';
import './Settings.css';

interface Settings {
  restTimer: number;
  units: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    restTimer: 90,
    units: 'metric'
  });
  const [userId] = useState(1);

  useEffect(() => {
    loadSettings();
  }, []);



  const loadSettings = () => {
    const saved = localStorage.getItem('rippedraccoon-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('rippedraccoon-settings', JSON.stringify(newSettings));
  };

  const exportData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/export/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rippedraccoon-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await fetch(`http://localhost:5000/api/import/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert('Data imported successfully! Please refresh the page.');
      } else {
        alert('Error importing data');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please check the file format.');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const resetWorkoutRecords = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL workout records? This will permanently remove:\n\n' +
      '• All completed workouts\n' +
      '• All workout logs and sets\n' +
      '• All progress data\n' +
      '• Weight tracking history\n\n' +
      'This action CANNOT be undone!'
    );
    
    if (!confirmed) return;
    
    const doubleConfirmed = window.confirm(
      'FINAL WARNING: This will delete everything. Are you absolutely sure?'
    );
    
    if (!doubleConfirmed) return;

    try {
      const response = await fetch(`http://localhost:5000/api/reset/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('All workout records have been deleted successfully.');
        window.location.reload();
      } else {
        alert('Error resetting workout records');
      }
    } catch (error) {
      console.error('Error resetting workout records:', error);
      alert('Error resetting workout records');
    }
  };

  return (
    <div className="settings-container">
      <h1 className="settings-header">⚙️ SETTINGS</h1>

      <div className="gym-card settings-section">
        <h3 className="settings-section-header">Workout Settings</h3>
        
        <div className="settings-form-group">
          <label className="settings-label">Default Rest Timer (seconds):</label>
          <input
            type="number"
            value={settings.restTimer}
            onChange={(e) => saveSettings({ ...settings, restTimer: parseInt(e.target.value) || 90 })}
            min="30"
            max="300"
            step="15"
            className="settings-input"
          />
          <small style={{ color: '#ffffff' }}>Time between sets (30-300 seconds)</small>
        </div>

        <div className="settings-form-group">
          <label className="settings-label">Unit Preference:</label>
          <select
            value={settings.units}
            onChange={(e) => saveSettings({ ...settings, units: e.target.value })}
            className="settings-input"
          >
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lbs, inches)</option>
          </select>
        </div>


      </div>

      <div className="gym-card">
        <h3 style={{ color: '#ff6600', textShadow: '0 0 10px rgba(255, 102, 0, 0.8)' }}>Data Management</h3>
        
        <div className="settings-form-group">
          <h4 style={{ color: '#9d00ff', textShadow: '0 0 10px rgba(157, 0, 255, 0.8)' }}>Export Data</h4>
          <p style={{ color: '#ffffff', fontSize: '14px' }}>
            Download all your workout data, progress, and settings as a JSON backup file.
          </p>
          <button
            onClick={exportData}
            className="gym-button"
          >
            📥 Export Backup
          </button>
        </div>

        <div>
          <h4 style={{ color: '#ff0080', textShadow: '0 0 10px rgba(255, 0, 128, 0.8)' }}>Import Data</h4>
          <p style={{ color: '#ffffff', fontSize: '14px' }}>
            Restore your data from a previously exported backup file. This will replace all current data.
          </p>
          <div style={{ marginTop: '10px' }}>
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ marginBottom: '10px' }}
            />
            <br />
            <small style={{ color: '#ff6600', textShadow: '0 0 5px rgba(255, 102, 0, 0.8)' }}>
              ⚠️ Warning: This will overwrite all existing data. Make sure to export a backup first.
            </small>
          </div>
        </div>
      </div>

      <div className="gym-card settings-section settings-danger-zone">
        <h3 className="settings-danger-header">⚠️ Danger Zone</h3>
        
        <div className="settings-form-group">
          <h4 className="settings-danger-header">Reset Workout Records</h4>
          <p className="settings-danger-text">
            This will permanently delete ALL completed workout records, progress data, and workout logs. This action cannot be undone.
          </p>
          <button
            onClick={resetWorkoutRecords}
            className="settings-danger-button"
          >
            🗑️ Clear All Workout Records
          </button>
        </div>
      </div>

      <div className="gym-card settings-section">
        <h4 style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0, 255, 255, 0.8)' }}>Current Settings Summary</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#ffffff' }}>
          <li>Rest Timer: {settings.restTimer} seconds</li>
          <li>Units: {settings.units === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, inches)'}</li>

        </ul>
      </div>
    </div>
  );
};

export default Settings;