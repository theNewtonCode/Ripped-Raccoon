import React, { useState, useEffect } from 'react';
import './Routines.css';

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  type: string;
  sets?: number;
  reps?: number;
}

interface Routine {
  id: number;
  name: string;
  user_id?: number;
  is_prebuilt: boolean;
  exercises?: Exercise[];
}

interface RoutineExercise {
  exercise_id: number;
  sets: number;
  reps: number;
}

const Routines: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [userId] = useState(1); // Demo user ID

  useEffect(() => {
    fetchRoutines();
    fetchExercises();
  }, []);

  const fetchRoutines = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/routines?prebuilt=true');
      if (response.ok) {
        const data = await response.json();
        setRoutines(data);
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/exercises');
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchRoutineDetails = async (routineId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/routines/${routineId}/details`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRoutine(data);
      }
    } catch (error) {
      console.error('Error fetching routine details:', error);
    }
  };

  const duplicateRoutine = async (routine: Routine) => {
    if (!routine.exercises) return;
    
    const routineData = {
      name: `${routine.name} (Copy)`,
      user_id: userId,
      exercises: routine.exercises.map(ex => ({
        exercise_id: ex.id,
        sets: ex.sets || 3,
        reps: ex.reps || 10
      }))
    };

    try {
      const response = await fetch('http://localhost:5000/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineData)
      });

      if (response.ok) {
        alert('Routine duplicated successfully!');
        setSelectedRoutine(null);
      }
    } catch (error) {
      console.error('Error duplicating routine:', error);
    }
  };

  const createCustomRoutine = async () => {
    if (!newRoutineName || selectedExercises.length === 0) return;

    const routineData = {
      name: newRoutineName,
      user_id: userId,
      exercises: selectedExercises
    };

    try {
      const response = await fetch('http://localhost:5000/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineData)
      });

      if (response.ok) {
        alert('Custom routine created successfully!');
        setShowCreateForm(false);
        setNewRoutineName('');
        setSelectedExercises([]);
      }
    } catch (error) {
      console.error('Error creating routine:', error);
    }
  };

  const addExerciseToRoutine = (exerciseId: number) => {
    if (selectedExercises.find(ex => ex.exercise_id === exerciseId)) return;
    
    setSelectedExercises([...selectedExercises, {
      exercise_id: exerciseId,
      sets: 3,
      reps: 10
    }]);
  };

  const updateExerciseInRoutine = (exerciseId: number, field: 'sets' | 'reps', value: number) => {
    setSelectedExercises(prev => 
      prev.map(ex => 
        ex.exercise_id === exerciseId 
          ? { ...ex, [field]: value }
          : ex
      )
    );
  };

  const removeExerciseFromRoutine = (exerciseId: number) => {
    setSelectedExercises(prev => prev.filter(ex => ex.exercise_id !== exerciseId));
  };

  if (selectedRoutine) {
    return (
      <div className="routines-container">
        <button onClick={() => setSelectedRoutine(null)} className="gym-button routines-back-button">← Back to Routines</button>
        
        <h2 className="routines-header">{selectedRoutine.name}</h2>
        {selectedRoutine.is_prebuilt && (
          <button 
            onClick={() => duplicateRoutine(selectedRoutine)}
            className="gym-button"
            style={{ marginBottom: '20px' }}
          >
            Duplicate as Custom Routine
          </button>
        )}
        
        <h3 className="routines-header-section">Exercises</h3>
        {selectedRoutine.exercises?.map((exercise) => (
          <div key={exercise.id} className="gym-card routines-exercise-card">
            <h4>{exercise.name}</h4>
            <p>Muscle Group: {exercise.muscle_group} | Type: {exercise.type}</p>
            <p className="sets-reps"><strong>Sets: {exercise.sets} | Reps: {exercise.reps}</strong></p>
          </div>
        ))}
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="routines-container">
        <button onClick={() => setShowCreateForm(false)} className="gym-button routines-back-button">← Back to Routines</button>
        
        <h2 className="routines-header">Create Custom Routine</h2>
        
        <div className="routines-form-group">
          <label className="routines-label">Routine Name:</label>
          <input
            type="text"
            value={newRoutineName}
            onChange={(e) => setNewRoutineName(e.target.value)}
            className="routines-input"
            placeholder="Enter routine name"
          />
        </div>

        <h3 className="routines-header-section">Selected Exercises ({selectedExercises.length})</h3>
        {selectedExercises.map((routineEx) => {
          const exercise = exercises.find(ex => ex.id === routineEx.exercise_id);
          return (
            <div key={routineEx.exercise_id} className="gym-card routines-selected-exercise">
              <div className="routines-exercise-grid">
                <span className="exercise-name"><strong>{exercise?.name}</strong> - {exercise?.muscle_group}</span>
                <button 
                  onClick={() => removeExerciseFromRoutine(routineEx.exercise_id)}
                  className="gym-button"
                  style={{ backgroundColor: '#dc3545', padding: '4px 8px' }}
                >
                  Remove
                </button>
              </div>
              <div className="routines-sets-reps-controls">
                <div>
                  <label className="routines-label">Sets:</label>
                  <input
                    type="number"
                    value={routineEx.sets}
                    onChange={(e) => updateExerciseInRoutine(routineEx.exercise_id, 'sets', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="routines-label">Reps:</label>
                  <input
                    type="number"
                    value={routineEx.reps}
                    onChange={(e) => updateExerciseInRoutine(routineEx.exercise_id, 'reps', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <h3 className="routines-available-exercises">Available Exercises</h3>
        <div className="gym-card routines-exercise-list">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="routines-exercise-item">
              <div className="exercise-info">
                <strong>{exercise.name}</strong> - {exercise.muscle_group} ({exercise.type})
              </div>
              <button
                onClick={() => addExerciseToRoutine(exercise.id)}
                disabled={selectedExercises.some(ex => ex.exercise_id === exercise.id)}
                className="gym-button"
                style={{ 
                  padding: '4px 8px',
                  backgroundColor: selectedExercises.some(ex => ex.exercise_id === exercise.id) ? '#6c757d' : undefined
                }}
              >
                {selectedExercises.some(ex => ex.exercise_id === exercise.id) ? 'Added' : 'Add'}
              </button>
            </div>
          ))}
        </div>

        <div className="routines-create-actions">
          <button
            onClick={createCustomRoutine}
            disabled={!newRoutineName || selectedExercises.length === 0}
            className="gym-button"
          >
            Create Routine
          </button>
          <button
            onClick={() => setShowCreateForm(false)}
            className="gym-button"
            style={{ backgroundColor: '#6c757d' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="routines-container">
      <div className="routines-header-actions">
        <h2 className="routines-header">Routines</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="gym-button"
        >
          Create Custom Routine
        </button>
      </div>

      <h3 className="routines-header-section">Prebuilt Routines</h3>
      {routines.map((routine) => (
        <div key={routine.id} className="gym-card routines-exercise-card">
          <div className="routines-exercise-grid">
            <h4>{routine.name}</h4>
            <button
              onClick={() => fetchRoutineDetails(routine.id)}
              className="gym-button"
            >
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Routines;