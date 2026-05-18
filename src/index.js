/**
 * Cloudflare Workers API for Person Tracker
 * D1 Database API
 */

// CI/CD Test Comment - $(date)

// Goals CRUD
async function getGoals(db) {
  const result = await db.prepare('SELECT * FROM goals ORDER BY createdAt DESC').all();
  return Response.json(result.results);
}

async function getGoal(db, id) {
  const result = await db.prepare('SELECT * FROM goals WHERE id = ?').bind(id).first();
  if (!result) {
    return Response.json({ error: 'Goal not found' }, { status: 404 });
  }
  return Response.json(result);
}

async function createGoal(db, data) {
  const { title, description, status, progress, startDate, endDate, createdAt, updatedAt } = data;
  const result = await db.prepare(`
    INSERT INTO goals (title, description, status, progress, startDate, endDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    title || '',
    description || '',
    status || 'not_started',
    progress || 0,
    startDate || null,
    endDate || null,
    createdAt || new Date().toISOString(),
    updatedAt || new Date().toISOString()
  ).run();

  const newGoal = await db.prepare('SELECT * FROM goals WHERE id = ?').bind(result.meta.last_row_id).first();
  return Response.json(newGoal, { status: 201 });
}

async function updateGoal(db, id, data) {
  const fields = [];
  const values = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.progress !== undefined) { fields.push('progress = ?'); values.push(data.progress); }
  if (data.startDate !== undefined) { fields.push('startDate = ?'); values.push(data.startDate); }
  if (data.endDate !== undefined) { fields.push('endDate = ?'); values.push(data.endDate); }
  fields.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  const goal = await db.prepare('SELECT * FROM goals WHERE id = ?').bind(id).first();
  return Response.json(goal);
}

async function deleteGoal(db, id) {
  // Delete related records first
  await db.prepare('DELETE FROM milestones WHERE goalId = ?').bind(id).run();
  await db.prepare('DELETE FROM dailyLogs WHERE goalId = ?').bind(id).run();
  await db.prepare('DELETE FROM quotes WHERE goalId = ?').bind(id).run();
  await db.prepare('DELETE FROM goals WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
}

// Milestones CRUD
async function getMilestones(db, goalId) {
  const result = await db.prepare('SELECT * FROM milestones WHERE goalId = ? ORDER BY createdAt ASC').bind(goalId).all();
  return Response.json(result.results);
}

async function createMilestone(db, goalId, data) {
  const { title, completed, dueDate, createdAt } = data;
  const result = await db.prepare(`
    INSERT INTO milestones (goalId, title, completed, dueDate, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    goalId,
    title || '',
    completed || false,
    dueDate || null,
    createdAt || new Date().toISOString()
  ).run();

  const milestone = await db.prepare('SELECT * FROM milestones WHERE id = ?').bind(result.meta.last_row_id).first();
  return Response.json(milestone, { status: 201 });
}

async function updateMilestone(db, id, data) {
  const fields = [];
  const values = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.completed !== undefined) { fields.push('completed = ?'); values.push(data.completed); }
  if (data.dueDate !== undefined) { fields.push('dueDate = ?'); values.push(data.dueDate); }
  values.push(id);

  await db.prepare(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  const milestone = await db.prepare('SELECT * FROM milestones WHERE id = ?').bind(id).first();
  return Response.json(milestone);
}

async function deleteMilestone(db, id) {
  await db.prepare('DELETE FROM milestones WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
}

// DailyLogs CRUD
async function getDailyLogs(db, goalId) {
  const result = await db.prepare('SELECT * FROM dailyLogs WHERE goalId = ? ORDER BY date DESC').bind(goalId).all();
  return Response.json(result.results);
}

async function createDailyLog(db, goalId, data) {
  const { date, completedItems, output, createdAt } = data;
  const result = await db.prepare(`
    INSERT INTO dailyLogs (goalId, date, completedItems, output, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    goalId,
    date || new Date().toISOString().split('T')[0],
    completedItems || '',
    output || '',
    createdAt || new Date().toISOString()
  ).run();

  const log = await db.prepare('SELECT * FROM dailyLogs WHERE id = ?').bind(result.meta.last_row_id).first();
  return Response.json(log, { status: 201 });
}

async function deleteDailyLog(db, id) {
  await db.prepare('DELETE FROM dailyLogs WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
}

// Get all logs (for dashboard)
async function getAllLogs(db) {
  const result = await db.prepare('SELECT * FROM dailyLogs ORDER BY date DESC').all();
  return Response.json(result.results);
}

// Quotes CRUD
async function getQuotes(db, goalId) {
  const result = await db.prepare('SELECT * FROM quotes WHERE goalId = ? ORDER BY createdAt DESC').bind(goalId).all();
  return Response.json(result.results);
}

async function createQuote(db, goalId, data) {
  const { content, createdAt } = data;
  const result = await db.prepare(`
    INSERT INTO quotes (goalId, content, createdAt)
    VALUES (?, ?, ?)
  `).bind(
    goalId,
    content || '',
    createdAt || new Date().toISOString()
  ).run();

  const quote = await db.prepare('SELECT * FROM quotes WHERE id = ?').bind(result.meta.last_row_id).first();
  return Response.json(quote, { status: 201 });
}

async function deleteQuote(db, id) {
  await db.prepare('DELETE FROM quotes WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
}

// Main request handler
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const db = env.DB;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const headers = { 'Content-Type': 'application/json', ...corsHeaders };

  try {
    // Goals
    if (path === '/api/goals' && method === 'GET') {
      return getGoals(db);
    }

    if (path === '/api/goals' && method === 'POST') {
      const data = await request.json();
      return createGoal(db, data);
    }

    if (path.match(/^\/api\/goals\/(\d+)$/) && method === 'GET') {
      const id = path.match(/^\/api\/goals\/(\d+)$/)[1];
      return getGoal(db, id);
    }

    if (path.match(/^\/api\/goals\/(\d+)$/) && method === 'PUT') {
      const id = path.match(/^\/api\/goals\/(\d+)$/)[1];
      const data = await request.json();
      return updateGoal(db, id, data);
    }

    if (path.match(/^\/api\/goals\/(\d+)$/) && method === 'DELETE') {
      const id = path.match(/^\/api\/goals\/(\d+)$/)[1];
      return deleteGoal(db, id);
    }

    // Milestones
    if (path.match(/^\/api\/goals\/(\d+)\/milestones$/) && method === 'GET') {
      const goalId = path.match(/^\/api\/goals\/(\d+)\/milestones$/)[1];
      return getMilestones(db, goalId);
    }

    if (path.match(/^\/api\/goals\/(\d+)\/milestones$/) && method === 'POST') {
      const goalId = path.match(/^\/api\/goals\/(\d+)\/milestones$/)[1];
      const data = await request.json();
      return createMilestone(db, goalId, data);
    }

    if (path.match(/^\/api\/milestones\/(\d+)$/) && method === 'PUT') {
      const id = path.match(/^\/api\/milestones\/(\d+)$/)[1];
      const data = await request.json();
      return updateMilestone(db, id, data);
    }

    if (path.match(/^\/api\/milestones\/(\d+)$/) && method === 'DELETE') {
      const id = path.match(/^\/api\/milestones\/(\d+)$/)[1];
      return deleteMilestone(db, id);
    }

    // DailyLogs
    if (path.match(/^\/api\/goals\/(\d+)\/logs$/) && method === 'GET') {
      const goalId = path.match(/^\/api\/goals\/(\d+)\/logs$/)[1];
      return getDailyLogs(db, goalId);
    }

    if (path.match(/^\/api\/goals\/(\d+)\/logs$/) && method === 'POST') {
      const goalId = path.match(/^\/api\/goals\/(\d+)\/logs$/)[1];
      const data = await request.json();
      return createDailyLog(db, goalId, data);
    }

    if (path.match(/^\/api\/logs\/(\d+)$/) && method === 'DELETE') {
      const id = path.match(/^\/api\/logs\/(\d+)$/)[1];
      return deleteDailyLog(db, id);
    }

    // All Logs (for dashboard)
    if (path === '/api/all-logs' && method === 'GET') {
      return getAllLogs(db);
    }

    // Quotes
    if (path.match(/^\/api\/goals\/(\d+)\/quotes$/) && method === 'GET') {
      const goalId = path.match(/^\/api\/goals\/(\d+)\/quotes$/)[1];
      return getQuotes(db, goalId);
    }

    if (path.match(/^\/api\/goals\/(\d+)\/quotes$/) && method === 'POST') {
      const goalId = path.match(/^\/api\/goals\/(\d+)\/quotes$/)[1];
      const data = await request.json();
      return createQuote(db, goalId, data);
    }

    if (path.match(/^\/api\/quotes\/(\d+)$/) && method === 'DELETE') {
      const id = path.match(/^\/api\/quotes\/(\d+)$/)[1];
      return deleteQuote(db, id);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
