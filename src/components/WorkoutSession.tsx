import React, { useState, useEffect, useRef } from 'react';
import './WorkoutSession.css';

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  type: string;
  sets: number;
  reps: number;
  icon_path?: string;
}

interface Routine {
  id: number;
  name: string;
  exercises: Exercise[];
  is_prebuilt?: boolean;
}

interface WorkoutLog {
  exercise_id: number;
  set_number: number;
  reps: number;
  weight: number;
  notes?: string;
}

interface WorkoutSummary {
  totalSets: number;
  totalVolume: number;
  duration: number;
  exercises: number;
}

const WorkoutSession: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [restTime, setRestTime] = useState(90);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const [lastSet, setLastSet] = useState<{ reps: string; weight: string } | null>(null);
  const [userId] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getMuscleGroupClass = (muscleGroup: string) => {
    const group = muscleGroup.toLowerCase();
    if (group.includes('chest')) return 'muscle-chest';
    if (group.includes('back')) return 'muscle-back';
    if (group.includes('leg')) return 'muscle-legs';
    if (group.includes('shoulder')) return 'muscle-shoulders';
    if (group.includes('arm') || group.includes('bicep') || group.includes('tricep')) return 'muscle-arms';
    if (group.includes('core') || group.includes('ab')) return 'muscle-core';
    return '';
  };

  const isExerciseCompleted = (exerciseId: number, targetSets: number) => {
    return workoutLogs.filter(log => log.exercise_id === exerciseId).length >= targetSets;
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  useEffect(() => {
    if (isResting && timeLeft > 0 && !isPaused) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isResting) {
      setIsResting(false);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isResting, isPaused]);

  const fetchRoutines = async () => {
    try {
      // Fetch both prebuilt and custom routines
      const [prebuiltResponse, customResponse] = await Promise.all([
        fetch('http://localhost:5000/api/routines?prebuilt=true'),
        fetch(`http://localhost:5000/api/routines?user_id=${userId}`)
      ]);
      
      const prebuiltData = prebuiltResponse.ok ? await prebuiltResponse.json() : [];
      const customData = customResponse.ok ? await customResponse.json() : [];
      
      const allRoutines = [...prebuiltData, ...customData];
      
      const routinesWithDetails = await Promise.all(
        allRoutines.map(async (routine: any) => {
          const detailsResponse = await fetch(`http://localhost:5000/api/routines/${routine.id}/details`);
          return detailsResponse.ok ? await detailsResponse.json() : routine;
        })
      );
      setRoutines(routinesWithDetails);
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  };

  const startWorkout = async (routine: Routine) => {
    setSelectedRoutine(routine);
    setStartTime(new Date());
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setWorkoutLogs([]);
    
    try {
      const response = await fetch('http://localhost:5000/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          routine_id: routine.id,
          date: new Date().toISOString().split('T')[0],
          duration: 0,
          is_draft: 1
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setWorkoutId(result.id);
      }
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  const completeSet = async () => {
    if (!selectedRoutine || !workoutId || !reps || !weight) {
      return;
    }
    
    const currentExercise = selectedRoutine.exercises?.[currentExerciseIndex];
    if (!currentExercise) {
      return;
    }
    
    const logEntry: WorkoutLog = {
      exercise_id: currentExercise.id,
      set_number: currentSet,
      reps: parseInt(reps),
      weight: parseFloat(weight),
      notes
    };

    try {
      const response = await fetch('http://localhost:5000/api/workout-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: workoutId,
          ...logEntry
        })
      });
      
      if (response.ok) {
        setWorkoutLogs([...workoutLogs, logEntry]);
        setLastSet({ reps, weight });
        setReps('');
        setWeight('');
        setNotes('');
        
        if (currentSet < currentExercise.sets) {
          setCurrentSet(currentSet + 1);
          startRestTimer();
        } else {
          nextExercise();
        }
      }
    } catch (error) {
      console.error('Error logging set:', error);
    }
  };

  const nextExercise = () => {
    if (!selectedRoutine || !selectedRoutine.exercises) return;
    
    // Check if all exercises are completed
    const allCompleted = selectedRoutine.exercises.every(exercise => 
      isExerciseCompleted(exercise.id, exercise.sets)
    );
    
    if (allCompleted) {
      finishWorkout(false); // false = not a draft, completed workout
    } else {
      // Find next incomplete exercise
      const nextIncomplete = selectedRoutine.exercises.findIndex((exercise, index) => 
        index > currentExerciseIndex && !isExerciseCompleted(exercise.id, exercise.sets)
      );
      
      if (nextIncomplete !== -1) {
        setCurrentExerciseIndex(nextIncomplete);
        setCurrentSet(1);
      } else {
        // If no incomplete exercise after current, find first incomplete
        const firstIncomplete = selectedRoutine.exercises.findIndex(exercise => 
          !isExerciseCompleted(exercise.id, exercise.sets)
        );
        
        if (firstIncomplete !== -1) {
          setCurrentExerciseIndex(firstIncomplete);
          setCurrentSet(1);
        } else {
          finishWorkout(false);
        }
      }
    }
  };

  const startRestTimer = () => {
    setTimeLeft(restTime);
    setIsResting(true);
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
  };

  const repeatLastSet = () => {
    if (lastSet) {
      setReps(lastSet.reps);
      setWeight(lastSet.weight);
    }
  };

  const undoLastSet = async () => {
    if (workoutLogs.length === 0 || !workoutId) return;
    
    const lastLog = workoutLogs[workoutLogs.length - 1];
    const currentExercise = selectedRoutine?.exercises?.[currentExerciseIndex];
    
    if (lastLog.exercise_id === currentExercise?.id) {
      try {
        // Remove from database (simplified - in real app would need delete endpoint)
        const updatedLogs = workoutLogs.slice(0, -1);
        setWorkoutLogs(updatedLogs);
        
        if (currentSet > 1) {
          setCurrentSet(currentSet - 1);
        }
        
        setReps(lastLog.reps.toString());
        setWeight(lastLog.weight.toString());
        setNotes(lastLog.notes || '');
      } catch (error) {
        // Error undoing set
      }
    }
  };

  const finishWorkout = async (isDraft: boolean) => {
    if (!workoutId || !startTime) return;
    
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);
    
    try {
      // Update the existing workout
      const response = await fetch(`http://localhost:5000/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          is_draft: isDraft ? 1 : 0
        })
      });

      const totalSets = workoutLogs.length;
      const totalVolume = workoutLogs.reduce((sum, log) => sum + (log.reps * log.weight), 0);
      
      setWorkoutSummary({
        totalSets,
        totalVolume,
        duration,
        exercises: new Set(workoutLogs.map(log => log.exercise_id)).size
      });
      
    } catch (error) {
      // Error finishing workout
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (workoutSummary) {
    return (
      <div className="workout-container" style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#39ff14', textShadow: '0 0 15px rgba(57, 255, 20, 0.8)' }}>Workout Complete! 🎉</h2>
        <div className="gym-card">
          <h3 style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0, 255, 255, 0.8)' }}>Summary</h3>
          <p style={{ color: '#ffffff' }}><strong>Duration:</strong> {workoutSummary.duration} minutes</p>
          <p style={{ color: '#ffffff' }}><strong>Exercises:</strong> {workoutSummary.exercises}</p>
          <p style={{ color: '#ffffff' }}><strong>Total Sets:</strong> {workoutSummary.totalSets}</p>
          <p style={{ color: '#ffffff' }}><strong>Total Volume:</strong> {workoutSummary.totalVolume} kg</p>
        </div>
        <button
          onClick={() => {
            setWorkoutSummary(null);
            setSelectedRoutine(null);
            setWorkoutId(null);
          }}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Start New Workout
        </button>
      </div>
    );
  }

  if (selectedRoutine) {
    const currentExercise = selectedRoutine.exercises?.[currentExerciseIndex];
    if (!currentExercise) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading exercise...</p>
        </div>
      );
    }
    
    const completedSets = workoutLogs.filter(log => log.exercise_id === currentExercise.id).length;
    
    return (
      <div className="workout-container">
        <div className="workout-exercise-header">
          <h2 className="workout-header" style={{ margin: 0 }}>{selectedRoutine.name}</h2>
          <div>
            <button
              onClick={pauseWorkout}
              className="gym-button"
              style={{ backgroundColor: isPaused ? '#28a745' : '#ffc107', color: 'white', border: 'none', marginRight: '10px' }}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              onClick={() => finishWorkout(false)}
              className="gym-button"
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none' }}
            >
              ✅ Finish Workout
            </button>
          </div>
        </div>

        <div className="workout-routine-selector">
          <label className="workout-label">Select Exercise:</label>
          <select
            value={currentExerciseIndex}
            onChange={(e) => {
              setCurrentExerciseIndex(parseInt(e.target.value));
              setCurrentSet(1);
            }}
            className="workout-input"
            style={{ fontSize: '16px' }}
          >
            {selectedRoutine.exercises.map((exercise, index) => (
              <option key={`${exercise.id}-${index}`} value={index}>
                {exercise.name} ({isExerciseCompleted(exercise.id, exercise.sets) ? 'Completed' : `${workoutLogs.filter(log => log.exercise_id === exercise.id).length}/${exercise.sets} sets`})
              </option>
            ))}
          </select>
        </div>

        <div 
          className={`gym-card ${getMuscleGroupClass(currentExercise.muscle_group)} ${isExerciseCompleted(currentExercise.id, currentExercise.sets) ? 'exercise-completed' : ''}`}
          style={{ 
            marginBottom: '20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}
        >
          <img 
            src={currentExercise.icon_path || '/images/pushup.svg'}
            alt={currentExercise.name}
            style={{ width: '48px', height: '48px', flexShrink: 0 }}
            onError={(e) => { 
              e.currentTarget.style.display = 'none'; 
            }}
          />
          <div>
            <h3 className="workout-exercise-title">{currentExercise.name}</h3>
            <p className="workout-exercise-info">Set {currentSet} of {currentExercise.sets} | Target: {currentExercise.reps} reps</p>
            <p className="workout-exercise-info">Muscle Group: {currentExercise.muscle_group}</p>
          </div>
        </div>

        {isResting && (
          <div className="workout-timer">
            <h3>Rest Time</h3>
            <div className="workout-timer-display">
              {formatTime(timeLeft)}
            </div>
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={() => setTimeLeft(0)}
                className="gym-button"
                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', marginRight: '10px' }}
              >
                ⏭ Skip Rest
              </button>
              <input
                type="number"
                value={restTime}
                onChange={(e) => setRestTime(parseInt(e.target.value) || 90)}
                style={{ width: '60px', padding: '4px', marginRight: '5px' }}
              />
              <span>seconds</span>
            </div>
          </div>
        )}

        {!isResting && (
          <div className="gym-card" style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#39ff14', textShadow: '0 0 10px rgba(57, 255, 20, 0.8)' }}>Log Set {currentSet}</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#00ffff', fontWeight: 'bold' }}>Reps:</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder={currentExercise.reps.toString()}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#00ffff', fontWeight: 'bold' }}>Weight (kg):</label>
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00ffff', fontWeight: 'bold' }}>Notes (optional):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel?"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {lastSet && (
                <button
                  onClick={repeatLastSet}
                  className="gym-button"
                  style={{ 
                    flex: 1,
                    backgroundColor: '#17a2b8', 
                    color: 'white', 
                    border: 'none'
                  }}
                >
                  🔄 Repeat Last
                </button>
              )}
              {workoutLogs.length > 0 && (
                <button
                  onClick={undoLastSet}
                  className="gym-button"
                  style={{ 
                    flex: 1,
                    backgroundColor: '#ffc107', 
                    color: 'black', 
                    border: 'none'
                  }}
                >
                  ↶ Undo
                </button>
              )}
            </div>
            <button
              onClick={completeSet}
              disabled={!reps || !weight || isPaused}
              className="gym-button"
              style={{ 
                width: '100%', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none'
              }}
            >
              ✓ Complete Set
            </button>
          </div>
        )}

        <div className="gym-card">
          <h4 style={{ color: '#ff6600', textShadow: '0 0 10px rgba(255, 102, 0, 0.8)' }}>Completed Sets ({completedSets}/{currentExercise.sets})</h4>
          {workoutLogs
            .filter(log => log.exercise_id === currentExercise.id)
            .map((log, index) => (
              <div key={index} style={{ padding: '8px', borderBottom: '1px solid #00ffff', color: '#ffffff' }}>
                Set {log.set_number}: {log.reps} reps × {log.weight} kg
                {log.notes && <span style={{ color: '#39ff14', marginLeft: '10px' }}>- {log.notes}</span>}
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="workout-container">
      <h2 className="workout-header">💪 START WORKOUT</h2>
      <p className="workout-no-routine" style={{ marginBottom: '30px' }}>Select a routine to begin your workout session:</p>
      
      {routines.map((routine) => (
        <div key={routine.id} className="gym-card" style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ color: '#39ff14', textShadow: '0 0 10px rgba(57, 255, 20, 0.8)' }}>{routine.name} {routine.is_prebuilt ? '' : '(Custom)'}</h4>
              <p style={{ color: '#ffffff' }}>{routine.exercises?.length || 0} exercises</p>
            </div>
            <button
              onClick={() => startWorkout(routine)}
              className="gym-button"
              style={{ backgroundColor: '#007bff', color: 'white', border: 'none' }}
            >
              🏋 Start Workout
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutSession;