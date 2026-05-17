-- D1 Database Schema for Person Tracker

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started',
  progress INTEGER DEFAULT 0,
  startDate TEXT,
  endDate TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goalId INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  dueDate TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

-- Daily logs table
CREATE TABLE IF NOT EXISTS dailyLogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goalId INTEGER NOT NULL,
  date TEXT NOT NULL,
  completedItems TEXT,
  output TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goalId INTEGER,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_milestones_goalId ON milestones(goalId);
CREATE INDEX IF NOT EXISTS idx_dailyLogs_goalId ON dailyLogs(goalId);
CREATE INDEX IF NOT EXISTS idx_dailyLogs_date ON dailyLogs(date);
CREATE INDEX IF NOT EXISTS idx_quotes_goalId ON quotes(goalId);
