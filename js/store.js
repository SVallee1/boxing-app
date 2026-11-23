/* Saved data (kept in this browser's localStorage) plus helpers for plans and sessions. */
window.Store = (function () {
  var KEY = 'boxingApp.v1';
  var defaults = function () {
    return {
      settings: { voice: true, voiceName: '', calls: 'start', roundSec: 180, restSec: 60 },
      activePlan: null,
      log: [],
      weights: [],
      trainer: { plans: [] }
    };
  };
  var state = null;
  function get() {
    if (state) return state;
    try { state = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { state = defaults(); }
    var d = defaults();
    Object.keys(d).forEach(function (k) { if (state[k] === undefined) state[k] = d[k]; });
    Object.keys(d.settings).forEach(function (k) { if (state.settings[k] === undefined) state.settings[k] = d.settings[k]; });
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function update(fn) { fn(get()); save(); }
  function reset() { state = defaults(); save(); }
  return { get: get, save: save, update: update, reset: reset };
})();

window.Plans = (function () {
  var D = APP_DATA;
  function dayStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function mondayOf(d) { var x = dayStart(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function iso(d) { var x = dayStart(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function byId(id) { return D.PLANS.filter(function (p) { return p.id === id; })[0]; }

  function weekSessions(plan, w) {
    var rows = plan.table ? plan.table[w] : plan.sessions(w);
    return rows.map(function (r, i) { return { planId: plan.id, week: w, slot: i, title: r[0], tags: r[1], minutes: r[2], dayIdx: plan.days[i] }; });
  }
  function active() { var a = Store.get().activePlan; return a ? { plan: byId(a.id), start: parse(a.start) } : null; }
  function currentWeek(a) {
    var days = Math.floor((dayStart(new Date()) - a.start) / 86400000);
    return Math.max(1, Math.min(a.plan.weeks, Math.floor(days / 7) + 1));
  }
  function dateFor(a, w, dayIdx) { var d = new Date(a.start); d.setDate(d.getDate() + (w - 1) * 7 + dayIdx); return d; }
  function isDone(s) { return Store.get().log.some(function (l) { return l.planId === s.planId && l.week === s.week && l.slot === s.slot; }); }
  function doneCount(planId) { var seen = {}; Store.get().log.forEach(function (l) { if (l.planId === planId) seen[l.week + ':' + l.slot] = 1; }); return Object.keys(seen).length; }

  function start(planId) { Store.update(function (s) { s.activePlan = { id: planId, start: iso(mondayOf(new Date())) }; }); }

  /* Today's session, or the next one not yet done. */
  function today() {
    var a = active();
    if (!a) return null;
    var w = currentWeek(a);
    var dIdx = (new Date().getDay() + 6) % 7;
    var list = weekSessions(a.plan, w);
    var todays = list.filter(function (s) { return s.dayIdx === dIdx; })[0];
    if (todays) return { session: todays, isToday: true, week: w };
    var next = list.filter(function (s) { return !isDone(s); })[0];
    return next ? { session: next, isToday: false, week: w } : { session: null, isToday: false, week: w };
  }

  /* Turns a session row into a warm-up round plus boxing rounds.
     Each boxing round holds a ladder of combos, one per minute, getting harder each minute. */
  function build(s) {
    var rounds = Math.max(4, Math.min(8, Math.round(s.minutes / 6)));
    var plan = s.planId ? byId(s.planId) : null;
    var seed = (s.week || 1) * 3 + (s.slot || 0) + (plan ? D.PLANS.indexOf(plan) * 2 : 0);
    var half = plan ? Math.ceil(plan.weeks / 2) : 99;
    var offset = (s.week || 1) > half ? 1 : 0;
    var list = [], used = {};
    for (var i = 0; i < rounds; i++) {
      var focus = s.tags[i % s.tags.length];
      var lad = D.LADDERS[focus];
      var k = seed + (used[focus] = (used[focus] || 0) + 1) - 1;
      var combos = [];
      for (var m = 0; m < 3; m++) { var lvl = lad[Math.min(lad.length - 1, m + offset)]; combos.push(lvl[k % lvl.length]); }
      list.push({ n: i + 1, focus: focus === 'Fitness' ? 'Fitness, fast hands' : focus === 'Offence' ? 'Offence, bag work' : focus, combos: combos });
    }
    var warm = { n: 0, warm: true, focus: 'Warm-up', combos: D.WARMUP.map(function (w) { return w.moves; }), texts: D.WARMUP.map(function (w) { return w.text; }) };
    var level = s.minutes >= 45 ? 'hard' : s.minutes >= 35 ? 'standard' : 'light';
    return { info: s, warm: warm, rounds: list, all: [warm].concat(list), conditioning: D.CONDITIONING[level], levelUp: offset > 0 };
  }
  function freeSession() { return { planId: null, week: 1, slot: 0, title: 'Free training', tags: ['Offence', 'Defence', 'Movement'], minutes: 35 }; }

  return { byId: byId, weekSessions: weekSessions, active: active, currentWeek: currentWeek, dateFor: dateFor, isDone: isDone, doneCount: doneCount, start: start, today: today, build: build, freeSession: freeSession, iso: iso, parse: parse, mondayOf: mondayOf };
})();
