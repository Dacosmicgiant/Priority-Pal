import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusCircle, Trash2, BookOpen, Clock, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'study-scheduler-data';
const DEFAULT_STUDY_TIME = 25 * 60; // 25 minutes in seconds
const DEFAULT_BREAK_TIME = 5 * 60; // 5 minutes in seconds

// Timer Component
const Timer = ({ time, isBreak, onComplete, subjectName }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">
            {isBreak ? 'Break Time!' : 'Study Session'}
          </h2>
          <div className="text-4xl font-mono font-bold">
            {formatTime(time)}
          </div>
          <p className="text-gray-600">
            {isBreak ? 'Time to relax!' : `Studying: ${subjectName}`}
          </p>
          {!isBreak && (
            <Button onClick={onComplete} className="mt-4">
              <Check className="w-4 h-4 mr-2" />
              Complete Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// TodoList Component
const TodoList = ({ subject, todos, onAddTodo, onToggleTodo, onDeleteTodo }) => {
  const [newTodo, setNewTodo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAddTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">{subject.name} Tasks</h3>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new task..."
          className="flex-1 p-2 border rounded"
        />
        <Button type="submit" size="sm">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add
        </Button>
      </form>

      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggleTodo(todo.id)}
              className="w-4 h-4"
            />
            <span className={todo.completed ? 'line-through text-gray-500 flex-1' : 'flex-1'}>
              {todo.text}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Main StudyScheduler Component
const StudyScheduler = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', difficulty: 5 });
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(DEFAULT_STUDY_TIME);
  const [isBreak, setIsBreak] = useState(false);
  const [todos, setTodos] = useState({});

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const { subjects, todos } = JSON.parse(savedData);
      setSubjects(subjects || []);
      setTodos(todos || {});
    }
  }, []);

  const saveData = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ subjects, todos }));
  };

  useEffect(() => {
    let timer;
    if (activeSession) {
      timer = setInterval(() => {
        setSessionTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (!isBreak) {
              setIsBreak(true);
              return DEFAULT_BREAK_TIME;
            } else {
              setIsBreak(false);
              setActiveSession(null);
              return DEFAULT_STUDY_TIME;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, isBreak]);

  const handleAddSubject = () => {
    if (newSubject.name.trim()) {
      const subject = {
        id: Date.now(),
        name: newSubject.name,
        difficulty: newSubject.difficulty,
        totalHours: 0
      };
      setSubjects([...subjects, subject]);
      setNewSubject({ name: '', difficulty: 5 });
      saveData();
    }
  };

  const handleDeleteSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id));
    const newTodos = { ...todos };
    delete newTodos[id];
    setTodos(newTodos);
    saveData();
  };

  const handleAddTodo = (subjectId, text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false
    };
    setTodos(prev => ({
      ...prev,
      [subjectId]: [...(prev[subjectId] || []), newTodo]
    }));
    saveData();
  };

  const handleToggleTodo = (subjectId, todoId) => {
    setTodos(prev => ({
      ...prev,
      [subjectId]: prev[subjectId].map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    }));
    saveData();
  };

  const handleDeleteTodo = (subjectId, todoId) => {
    setTodos(prev => ({
      ...prev,
      [subjectId]: prev[subjectId].filter(todo => todo.id !== todoId)
    }));
    saveData();
  };

  const handleCompleteSession = () => {
    if (activeSession) {
      const newSubjects = subjects.map(subject =>
        subject.id === activeSession
          ? { ...subject, totalHours: subject.totalHours + (DEFAULT_STUDY_TIME / 3600) }
          : subject
      );
      setSubjects(newSubjects);
      setActiveSession(null);
      setSessionTime(DEFAULT_STUDY_TIME);
      setIsBreak(false);
      saveData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-8 h-8" />
        Study Scheduler
      </h1>

      {activeSession && (
        <Timer
          time={sessionTime}
          isBreak={isBreak}
          onComplete={handleCompleteSession}
          subjectName={subjects.find(s => s.id === activeSession)?.name}
        />
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Subject name"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="flex-1 p-2 border rounded"
            />
            <select
              value={newSubject.difficulty}
              onChange={(e) => setNewSubject({ ...newSubject, difficulty: Number(e.target.value) })}
              className="p-2 border rounded"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>Difficulty: {num}</option>
              ))}
            </select>
            <Button onClick={handleAddSubject}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {subjects.map(subject => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{subject.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Difficulty: {subject.difficulty}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 mb-4">
                Total Hours: {subject.totalHours.toFixed(1)}h
              </div>

              {!activeSession && (
                <Button
                  onClick={() => {
                    setActiveSession(subject.id);
                    setSessionTime(DEFAULT_STUDY_TIME);
                    setIsBreak(false);
                  }}
                  className="w-full mb-4"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Start Study Session
                </Button>
              )}

              <TodoList
                subject={subject}
                todos={todos[subject.id] || []}
                onAddTodo={(text) => handleAddTodo(subject.id, text)}
                onToggleTodo={(todoId) => handleToggleTodo(subject.id, todoId)}
                onDeleteTodo={(todoId) => handleDeleteTodo(subject.id, todoId)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {subjects.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjects}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalHours" fill="#3b82f6" name="Hours Studied" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudyScheduler;