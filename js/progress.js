// progress.js — remembers which lessons you finished, your best quiz score and the days you practiced.
// Saved in this browser only (localStorage), like riffs and settings.

const KEY = 'riffboi.learn';

export function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    return {
      lessons: Array.isArray(data?.lessons) ? data.lessons : [],
      days: Array.isArray(data?.days) ? data.days : [],
      bestQuiz: Number(data?.bestQuiz) || 0,
    };
  } catch {
    return { lessons: [], days: [], bestQuiz: 0 };
  }
}

function save(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Not vital (e.g. a private window): progress just won't be remembered.
  }
}

// Today as "2026-10-26", in the player's own time zone.
export const todayString = () => new Date().toLocaleDateString('en-CA');

// Days in a row you practiced, counting back from today (or from yesterday, if you haven't yet today).
export function streakOf(days, today = todayString()) {
  const set = new Set(days);
  const date = new Date(`${today}T12:00:00`);
  const dayString = (d) => d.toLocaleDateString('en-CA');
  if (!set.has(dayString(date))) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (set.has(dayString(date))) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function addToday(progress) {
  const today = todayString();
  if (!progress.days.includes(today)) progress.days.push(today);
  progress.days = progress.days.slice(-400); // plenty for a streak, and keeps the saved data small
}

// Tick or untick a lesson. Returns the new progress.
export function toggleLesson(id) {
  const progress = loadProgress();
  if (progress.lessons.includes(id)) progress.lessons = progress.lessons.filter((l) => l !== id);
  else {
    progress.lessons.push(id);
    addToday(progress);
  }
  save(progress);
  return progress;
}

// Remember a finished quiz round.
export function recordQuiz(correct) {
  const progress = loadProgress();
  progress.bestQuiz = Math.max(progress.bestQuiz, correct);
  addToday(progress);
  save(progress);
  return progress;
}

// One line for the home screen.
export function progressLine(totalLessons) {
  const progress = loadProgress();
  const parts = [`${progress.lessons.length} of ${totalLessons} lessons`];
  if (progress.bestQuiz) parts.push(`quiz best ${progress.bestQuiz}/10`);
  const streak = streakOf(progress.days);
  if (streak > 0) parts.push(`${streak} day streak`);
  return parts.join(' · ');
}
