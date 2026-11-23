/* Trainer section.
   Coach: plan a session exercise by exercise (with a combination for every minute of every round),
   run it in the round timer, log how it went with feedback, then release it to the boxer.
   Boxer: sees released sessions and the coach's feedback, adds their own comments, and it counts in Progress.
   Everything is saved in this browser as you type. Coach and boxer share this device in this version. */
window.Trainer = (function () {
  var D = APP_DATA;
  var OTHER = '__other';
  var ROUND_CATS = ['technique', 'footwork', 'pads', 'bag', 'sparring'];

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cat(id) { return D.TRAINER.filter(function (c) { return c.id === id; })[0] || D.TRAINER[0]; }
  function st() { var s = Store.get(); if (!s.trainer) s.trainer = { plans: [] }; return s.trainer; }
  function role() { return Store.get().settings.role === 'boxer' ? 'boxer' : 'coach'; }
  function plan(id) { return st().plans.filter(function (p) { return p.id === id; })[0]; }
  function save() { Store.save(); }
  function todayIso() { return Plans.iso(new Date()); }
  function niceDate(iso) { if (!iso) return 'No date'; return Plans.parse(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function actName(ex) { return ex.activity === OTHER ? (ex.custom || 'Other activity') : ex.activity; }
  function perRound(ex) { return Math.max(1, Math.round(+ex.roundMin || 3)); }
  function plannable(ex) { return ex.measure === 'rounds' && ROUND_CATS.indexOf(ex.cat) > -1; }
  function newExercise(catId) {
    var c = cat(catId || 'warmup');
    return { cat: c.id, activity: c.activities[0], custom: '', measure: c.measure, mins: 5, rounds: 3, roundMin: 3, restSec: 60, sets: 3, reps: 10, notes: '', plan: [] };
  }
  function amount(ex) {
    if (ex.measure === 'time') return (ex.mins || 0) + ' min';
    if (ex.measure === 'rounds') return (ex.rounds || 0) + ' × ' + (ex.roundMin || 0) + ' min, ' + (ex.restSec || 0) + ' s rest';
    return (ex.sets || 0) + ' × ' + (ex.reps || 0);
  }
  function minutes(ex) {
    if (ex.measure === 'time') return +ex.mins || 0;
    if (ex.measure === 'rounds') return (+ex.rounds || 0) * (+ex.roundMin || 0) + Math.max(0, (+ex.rounds || 0) - 1) * (+ex.restSec || 0) / 60;
    return (+ex.sets || 0) * 1.5;
  }
  function total(p) { return Math.round(p.exercises.reduce(function (n, ex) { return n + minutes(ex); }, 0)); }
  /* Keep the round plan the same size as rounds × minutes. */
  function syncPlan(ex) {
    if (!ex.plan) ex.plan = [];
    var R = Math.max(0, Math.min(20, +ex.rounds || 0)), M = perRound(ex);
    ex.plan.length = R;
    for (var r = 0; r < R; r++) { var row = ex.plan[r] || []; row.length = M; for (var m = 0; m < M; m++) if (row[m] == null) row[m] = ''; ex.plan[r] = row; }
  }
  function status(p) {
    if (p.boxerLog) return ['Boxer replied', 'pill'];
    if (p.released) return ['Released', 'pill soft'];
    if (p.logged) return ['Logged', 'pill soft'];
    return ['Planned', 'pill ghost'];
  }
  /* Words in a typed combination → moves the demo boxer can act out. */
  function parseMoves(text) {
    var out = [];
    String(text || '').toLowerCase().split(/[,;\/+]|\s-\s|\bthen\b/).forEach(function (part) {
      var p = part.trim(); if (!p) return;
      var m = /rear upper/.test(p) ? 'uppercut' : /lead upper/.test(p) ? 'leaduppercut' : /upper/.test(p) ? 'uppercut'
        : /rear hook/.test(p) ? 'rearhook' : /hook/.test(p) ? 'hook' : /straight|cross|^2$/.test(p) ? 'cross' : /jab|^1$/.test(p) ? 'jab'
        : /lead slip/.test(p) ? 'leadslip' : /slip/.test(p) ? 'slip' : /lead roll/.test(p) ? 'leadroll' : /roll/.test(p) ? 'roll'
        : /step|in and out|pivot|angle/.test(p) ? 'step' : /push/.test(p) ? 'pushup' : null;
      if (m) out.push(m);
    });
    return out.length ? out : ['guard'];
  }
  function comboIdeas() {
    var seen = {}, out = [];
    Object.keys(D.LADDERS).forEach(function (k) { D.LADDERS[k].forEach(function (lvl) { lvl.forEach(function (c) { var t = c.map(function (m) { return D.MOVES[m].name; }).join(', '); if (!seen[t]) { seen[t] = 1; out.push(t); } }); }); });
    return out;
  }
  function autofill(ex) {
    syncPlan(ex);
    var lad = D.LADDERS[ex.cat === 'footwork' ? 'Movement' : ex.cat === 'sparring' ? 'Defence' : 'Offence'];
    ex.plan.forEach(function (row, r) {
      for (var m = 0; m < row.length; m++) {
        var lvl = lad[Math.min(lad.length - 1, Math.round(m * (Math.min(3, lad.length) - 1) / Math.max(1, row.length - 1)) + (r >= 2 ? 1 : 0))];
        if (!row[m]) row[m] = lvl[(r + m) % lvl.length].map(function (k) { return D.MOVES[k].name; }).join(', ');
      }
    });
  }

  /* Turns a plan into rounds the round timer can run (warm-up round + every planned round). */
  function toSession(p) {
    var rounds = [];
    p.exercises.filter(function (ex) { return ex.measure === 'rounds'; }).forEach(function (ex) {
      syncPlan(ex);
      for (var r = 0; r < (+ex.rounds || 0); r++) {
        var texts = ex.plan[r].map(function (t) { return t || actName(ex); });
        rounds.push({ n: rounds.length + 1, focus: actName(ex), texts: texts, combos: texts.map(parseMoves) });
      }
    });
    var wu = p.exercises.filter(function (ex) { return ex.cat === 'warmup'; });
    var warm = wu.length
      ? { n: 0, warm: true, focus: 'Warm-up', texts: [0, 1, 2].map(function (i) { var e = wu[Math.min(i, wu.length - 1)]; return actName(e) + (e.notes ? '. ' + e.notes : ''); }), combos: [['step'], ['jab', 'cross'], ['slip', 'roll']] }
      : { n: 0, warm: true, focus: 'Warm-up', texts: D.WARMUP.map(function (w) { return w.text; }), combos: D.WARMUP.map(function (w) { return w.moves; }) };
    var info = { planId: null, trainerPlan: p.id, week: 1, slot: 0, title: p.name || 'Coach session', tags: tagsOf(p.exercises), minutes: total(p) };
    return { info: info, warm: warm, rounds: rounds, all: [warm].concat(rounds), conditioning: [], levelUp: false };
  }
  function tagsOf(list) { var t = {}; list.forEach(function (ex) { cat(ex.cat).tags.forEach(function (k) { t[k] = 1; }); }); return Object.keys(t).length ? Object.keys(t) : ['Fitness']; }

  /* ---------- icons ---------- */
  var I = {
    up: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    del: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };
  function back(href, label) { return '<a class="icon-btn back" href="' + href + '" aria-label="' + label + '">' + I.back + '</a>'; }
  function roleSwitch() {
    var r = role();
    return '<div class="seg wide" role="group" aria-label="Who is using the app">' +
      '<button class="seg-btn' + (r === 'coach' ? ' on' : '') + '" data-tr="role" data-v="coach" aria-pressed="' + (r === 'coach') + '">Coach</button>' +
      '<button class="seg-btn' + (r === 'boxer' ? ' on' : '') + '" data-tr="role" data-v="boxer" aria-pressed="' + (r === 'boxer') + '">Boxer</button></div>';
  }

  /* ---------- coach: list ---------- */
  function listScreen() {
    if (role() === 'boxer') return boxerList();
    var plans = st().plans.slice().sort(function (a, b) { return (a.date || '') < (b.date || '') ? -1 : 1; });
    var planned = plans.filter(function (p) { return !p.logged; });
    var done = plans.filter(function (p) { return p.logged; }).reverse();
    function card(p) {
      var s = status(p);
      var meta = niceDate(p.date) + (p.boxer ? ' · ' + esc(p.boxer) : '') + ' · ' + p.exercises.length + ' exercise' + (p.exercises.length === 1 ? '' : 's') + ' · ≈ ' + total(p) + ' min';
      return '<a class="list-row" href="#/trainer/' + (p.logged ? 'log/' : 'edit/') + p.id + '"><span class="grow stack-xs"><span class="b">' + esc(p.name || 'Untitled session') + '</span><span class="muted small">' + meta + '</span></span><span class="' + s[1] + '">' + s[0] + '</span></a>';
    }
    return '<main class="screen stack">' + roleSwitch() +
      '<div class="stack-s"><p class="eyebrow">Coach</p><h1 class="h1">Plan &amp; log</h1><p class="muted">Plan a session, run it on the timer, log it with feedback, then release it to your boxer.</p></div>' +
      '<button class="btn-primary" data-tr="new">Plan a new session</button>' +
      '<section class="stack-s"><h2 class="label">Planned</h2>' + (planned.length ? planned.map(card).join('') : '<p class="muted small">Nothing planned yet.</p>') + '</section>' +
      (done.length ? '<section class="stack-s"><h2 class="label">Logged</h2>' + done.map(card).join('') + '</section>' : '') +
      '</main>';
  }

  /* ---------- coach: planner ---------- */
  function measureFields(ex, attrs) {
    function num(f, label, step) { return '<label class="field"><span>' + label + '</span><input class="input" type="number" inputmode="decimal" min="0" step="' + (step || 1) + '" ' + attrs + ' data-f="' + f + '" value="' + esc(ex[f]) + '"></label>'; }
    if (ex.measure === 'time') return '<div class="grid3">' + num('mins', 'Minutes', 0.5) + '</div>';
    if (ex.measure === 'rounds') return '<div class="grid3">' + num('rounds', 'Rounds') + num('roundMin', 'Min each', 1) + num('restSec', 'Rest (s)', 5) + '</div>';
    return '<div class="grid3">' + num('sets', 'Sets') + num('reps', 'Reps') + '</div>';
  }
  function roundPlanner(ex, i) {
    syncPlan(ex);
    if (!ex.plan.length) return '';
    var M = perRound(ex);
    var rows = ex.plan.map(function (row, r) {
      return '<div class="rp"><span class="b small">Round ' + (r + 1) + '</span>' + row.map(function (val, m) {
        return '<label class="rp-min"><span class="muted xs">Min ' + (m + 1) + '</span><input class="input" type="text" list="comboIdeas" data-ex="' + i + '" data-rp="' + r + ':' + m + '" value="' + esc(val) + '" placeholder="e.g. Jab, Straight, Lead hook"></label>';
      }).join('') + '</div>';
    }).join('');
    return '<details class="rp-wrap" open><summary class="row between"><span class="small b">Round plan · ' + M + ' combo' + (M > 1 ? 's' : '') + ' per round, one a minute</span></summary>' +
      '<div class="stack-s pad-t">' + rows + '<button class="btn-ghost" data-tr="autofill" data-ex="' + i + '">Auto-fill empty boxes</button></div></details>';
  }
  function exerciseCard(ex, i, n) {
    var c = cat(ex.cat);
    var at = 'data-ex="' + i + '"';
    var cats = D.TRAINER.map(function (k) { return '<option value="' + k.id + '"' + (k.id === ex.cat ? ' selected' : '') + '>' + k.name + '</option>'; }).join('');
    var acts = c.activities.map(function (a) { return '<option' + (a === ex.activity ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') +
      '<option value="' + OTHER + '"' + (ex.activity === OTHER ? ' selected' : '') + '>Other – type your own</option>';
    var measures = [['time', 'Time'], ['rounds', 'Rounds'], ['sets', 'Sets & reps']].map(function (m) { return '<option value="' + m[0] + '"' + (ex.measure === m[0] ? ' selected' : '') + '>' + m[1] + '</option>'; }).join('');
    return '<section class="card stack-s" aria-label="Exercise ' + (i + 1) + '">' +
      '<div class="row between"><h2 class="label">Exercise ' + (i + 1) + ' · ' + c.name + '</h2><div class="row tight">' +
      '<button class="icon-btn sm" data-tr="up" ' + at + ' aria-label="Move exercise ' + (i + 1) + ' up"' + (i === 0 ? ' disabled' : '') + '>' + I.up + '</button>' +
      '<button class="icon-btn sm" data-tr="down" ' + at + ' aria-label="Move exercise ' + (i + 1) + ' down"' + (i === n - 1 ? ' disabled' : '') + '>' + I.down + '</button>' +
      '<button class="icon-btn sm" data-tr="del" ' + at + ' aria-label="Remove exercise ' + (i + 1) + '">' + I.del + '</button></div></div>' +
      '<div class="grid2"><label class="field"><span>Type</span><select class="input" ' + at + ' data-f="cat">' + cats + '</select></label>' +
      '<label class="field"><span>Activity</span><select class="input" ' + at + ' data-f="activity">' + acts + '</select></label></div>' +
      (ex.activity === OTHER ? '<label class="field"><span>Your activity</span><input class="input" type="text" ' + at + ' data-f="custom" value="' + esc(ex.custom) + '" placeholder="e.g. Hill sprints, tyre flips"></label>' : '') +
      '<label class="field"><span>Measure by</span><select class="input" ' + at + ' data-f="measure">' + measures + '</select></label>' +
      measureFields(ex, at) +
      (plannable(ex) ? roundPlanner(ex, i) : '') +
      '<label class="field"><span>Coaching notes</span><textarea class="input" rows="2" ' + at + ' data-f="notes" placeholder="Focus points, intensity, what to watch for">' + esc(ex.notes) + '</textarea></label>' +
      '</section>';
  }
  function editScreen(id) {
    var p = plan(id);
    if (!p) return listScreen();
    var quick = D.TRAINER.map(function (c) { return '<button class="chip" data-tr="add" data-cat="' + c.id + '">+ ' + c.name + '</button>'; }).join('');
    var hasRounds = p.exercises.some(function (ex) { return ex.measure === 'rounds' && +ex.rounds > 0; });
    return '<main class="screen stack with-cta">' + back('#/trainer', 'Back to coach list') +
      '<div class="stack-xs"><p class="eyebrow">Plan a session</p><p class="muted small" id="trTotal">≈ ' + total(p) + ' min · saved automatically</p></div>' +
      '<section class="card stack-s">' +
      '<label class="field"><span>Session name</span><input class="input" type="text" data-p="name" value="' + esc(p.name) + '" placeholder="e.g. Tuesday pads and conditioning"></label>' +
      '<div class="grid2"><label class="field"><span>Boxer</span><input class="input" type="text" data-p="boxer" value="' + esc(p.boxer) + '" placeholder="Name"></label>' +
      '<label class="field"><span>Date</span><input class="input" type="date" data-p="date" value="' + esc(p.date) + '"></label></div>' +
      '</section>' +
      p.exercises.map(function (ex, i) { return exerciseCard(ex, i, p.exercises.length); }).join('') +
      '<section class="stack-s"><h2 class="label">Add an exercise</h2><div class="chips">' + quick + '</div></section>' +
      '<datalist id="comboIdeas">' + comboIdeas().map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
      '<button class="btn-link" data-tr="delete-plan">Delete this plan</button>' +
      '<div class="cta row">' + (hasRounds ? '<button class="btn-ghost grow" data-tr="run">Run in timer</button>' : '<a class="btn-ghost grow" href="#/trainer">Done</a>') +
      '<a class="btn-primary grow" href="#/trainer/log/' + p.id + '">Log session</a></div>' +
      '</main>';
  }

  /* ---------- coach: log + release ---------- */
  function ensureDraft(p) {
    if (p.draftLog && p.draftLog.results.length === p.exercises.length) return p.draftLog;
    p.draftLog = p.logged ? JSON.parse(JSON.stringify(p.logged)) : {
      effort: 7, well: '', improve: '', notes: '',
      results: p.exercises.map(function (ex) { var r = JSON.parse(JSON.stringify(ex)); r.done = true; r.how = ''; return r; })
    };
    save();
    return p.draftLog;
  }
  function logScreen(id) {
    var p = plan(id);
    if (!p) return listScreen();
    var L = ensureDraft(p);
    var rows = L.results.map(function (r, i) {
      var at = 'data-lx="' + i + '"';
      return '<section class="card stack-s">' +
        '<label class="row between check"><span class="stack-xs"><span class="b">' + (i + 1) + '. ' + esc(actName(r)) + '</span><span class="muted small">' + cat(r.cat).name + ' · planned ' + esc(amount(p.exercises[i] || r)) + '</span></span>' +
        '<input type="checkbox" ' + at + ' data-f="done"' + (r.done ? ' checked' : '') + ' aria-label="Done"></label>' +
        (r.done ? measureFields(r, at) + '<label class="field"><span>How it went</span><input class="input" type="text" ' + at + ' data-f="how" value="' + esc(r.how) + '" placeholder="e.g. sharp, dropped hands late on"></label>' : '<p class="muted small">Skipped</p>') +
        '</section>';
    }).join('');
    var s = status(p);
    var cta = p.released
      ? '<button class="btn-primary" data-tr="save-log" data-id="' + p.id + '">Update and keep released</button>'
      : '<div class="row"><button class="btn-ghost grow" data-tr="save-log" data-id="' + p.id + '">Save log</button><button class="btn-primary grow" data-tr="release" data-id="' + p.id + '">Save &amp; release to boxer</button></div>';
    return '<main class="screen stack with-cta">' + back('#/trainer/edit/' + p.id, 'Back to plan') +
      '<div class="stack-s"><div class="row between"><p class="eyebrow">Log session</p><span class="' + s[1] + '">' + s[0] + '</span></div><h1 class="h1">' + esc(p.name || 'Untitled session') + '</h1>' +
      '<p class="muted small">' + niceDate(p.date) + (p.boxer ? ' · ' + esc(p.boxer) : '') + ' · You can fill this in before or after the session.</p></div>' +
      rows +
      '<section class="card stack-s"><h2 class="h3">Your feedback for the boxer</h2>' +
      '<label class="field"><span>What they did well</span><textarea class="input" rows="2" data-l="well" placeholder="e.g. Jab was sharp, good head movement after combos">' + esc(L.well) + '</textarea></label>' +
      '<label class="field"><span>What to work on</span><textarea class="input" rows="2" data-l="improve" placeholder="e.g. Hands drop after the hook, breathe on the bag">' + esc(L.improve) + '</textarea></label>' +
      '<label class="field"><span>Work rate <b id="trEff">' + L.effort + '</b>/10</span><input type="range" min="1" max="10" data-l="effort" value="' + L.effort + '"></label>' +
      '<label class="field"><span>Other notes</span><textarea class="input" rows="2" data-l="notes" placeholder="Anything else">' + esc(L.notes) + '</textarea></label>' +
      '</section>' +
      (p.boxerLog ? boxerReplyCard(p) : '') +
      '<div class="cta">' + cta + '</div></main>';
  }
  function boxerReplyCard(p) {
    var b = p.boxerLog;
    return '<section class="card stack-s"><h2 class="h3">' + esc(p.boxer || 'Boxer') + '’s comments</h2>' +
      (b.well ? '<p class="small"><b>Did well:</b> ' + esc(b.well) + '</p>' : '') +
      (b.improve ? '<p class="small"><b>Wants to improve:</b> ' + esc(b.improve) + '</p>' : '') +
      (b.comments ? '<p class="small"><b>Comments:</b> ' + esc(b.comments) + '</p>' : '') +
      '<p class="muted small">Felt it at ' + b.effort + '/10</p></section>';
  }

  /* ---------- boxer ---------- */
  function boxerList() {
    var rel = st().plans.filter(function (p) { return p.released; }).sort(function (a, b) { return (a.date || '') < (b.date || '') ? 1 : -1; });
    var cards = rel.map(function (p) {
      var isNew = !p.boxerLog;
      return '<a class="list-row" href="#/trainer/boxer/' + p.id + '"><span class="grow stack-xs"><span class="b">' + esc(p.name || 'Session') + '</span><span class="muted small">' + niceDate(p.date) + ' · ≈ ' + total(p) + ' min</span></span>' +
        '<span class="' + (isNew ? 'pill' : 'pill soft') + '">' + (isNew ? 'New' : 'Logged') + '</span></a>';
    }).join('');
    return '<main class="screen stack">' + roleSwitch() +
      '<div class="stack-s"><p class="eyebrow">Boxer</p><h1 class="h1">From your coach</h1><p class="muted">Sessions your coach has released. Read their feedback and add your own comments.</p></div>' +
      (cards || '<section class="card"><p class="muted">Nothing released yet. When your coach logs a session and releases it, it appears here.</p></section>') +
      '</main>';
  }
  function boxerScreen(id) {
    var p = plan(id);
    if (!p || !p.released) return boxerList();
    var L = p.logged || { results: [], well: '', improve: '', notes: '' };
    if (!p.draftBoxer) { p.draftBoxer = p.boxerLog ? JSON.parse(JSON.stringify(p.boxerLog)) : { effort: 7, well: '', improve: '', comments: '' }; save(); }
    var B = p.draftBoxer;
    var did = L.results.map(function (r) {
      var rp = plannable(r) && r.plan && r.plan.some(function (row) { return row.some(function (x) { return x; }); })
        ? '<details><summary class="muted small">Round plan</summary><div class="stack-xs pad-t">' + r.plan.map(function (row, k) { return '<span class="small"><b>R' + (k + 1) + '</b> ' + row.map(esc).join(' → ') + '</span>'; }).join('') + '</div></details>' : '';
      return '<div class="stack-xs ex-sum"><span class="small"><b>' + esc(actName(r)) + '</b> · ' + esc(amount(r)) + (r.done ? '' : ' · skipped') + '</span>' + (r.how ? '<span class="muted small">' + esc(r.how) + '</span>' : '') + rp + '</div>';
    }).join('');
    return '<main class="screen stack with-cta">' + back('#/trainer', 'Back') +
      '<div class="stack-s"><p class="eyebrow">' + niceDate(p.date) + '</p><h1 class="h1">' + esc(p.name || 'Session') + '</h1></div>' +
      '<section class="card stack-s"><h2 class="h3">Coach’s feedback</h2>' +
      (L.well ? '<p class="small"><b class="good">Did well:</b> ' + esc(L.well) + '</p>' : '') +
      (L.improve ? '<p class="small"><b class="accent">Work on:</b> ' + esc(L.improve) + '</p>' : '') +
      (L.notes ? '<p class="small muted">' + esc(L.notes) + '</p>' : '') +
      '<p class="muted small">Work rate: ' + L.effort + '/10</p></section>' +
      '<section class="card stack-s"><h2 class="h3">What you did</h2>' + did + '</section>' +
      '<section class="card stack-s"><h2 class="h3">Your comments</h2>' +
      '<label class="field"><span>How hard did it feel? <b id="bxEff">' + B.effort + '</b>/10</span><input type="range" min="1" max="10" data-b="effort" value="' + B.effort + '"></label>' +
      '<label class="field"><span>What I did well</span><textarea class="input" rows="2" data-b="well" placeholder="e.g. Kept my guard up on the pads">' + esc(B.well) + '</textarea></label>' +
      '<label class="field"><span>What I want to improve</span><textarea class="input" rows="2" data-b="improve" placeholder="e.g. Faster feet after the jab">' + esc(B.improve) + '</textarea></label>' +
      '<label class="field"><span>Other comments</span><textarea class="input" rows="2" data-b="comments" placeholder="How you felt, anything sore, questions for your coach">' + esc(B.comments) + '</textarea></label>' +
      '</section>' +
      '<div class="cta"><button class="btn-primary" data-tr="boxer-save" data-id="' + p.id + '">' + (p.boxerLog ? 'Update my log' : 'Save to my progress') + '</button></div></main>';
  }

  /* ---------- saving ---------- */
  function saveCoachLog(p) {
    p.logged = JSON.parse(JSON.stringify(ensureDraft(p)));
    delete p.draftLog;
    save();
  }
  function saveBoxerLog(p) {
    var B = p.draftBoxer, L = p.logged || { results: [] };
    var done = L.results.filter(function (r) { return r.done; });
    var rounds = done.reduce(function (n, r) { return n + (r.measure === 'rounds' ? (+r.rounds || 0) : 0); }, 0);
    var push = done.reduce(function (n, r) { return n + (/push-?up/i.test(actName(r)) && r.measure === 'sets' ? (+r.sets || 0) * (+r.reps || 0) : 0); }, 0);
    Store.update(function (s) {
      s.log = s.log.filter(function (l) { return l.trainerPlan !== p.id; });
      s.log.push({ date: p.date || todayIso(), planId: null, trainerPlan: p.id, title: p.name || 'Coach session', tags: tagsOf(done), rounds: rounds, minutes: Math.round(done.reduce(function (n, r) { return n + minutes(r); }, 0)), effort: +B.effort, pushups: push, notes: [B.well, B.improve, B.comments].filter(Boolean).join(' · ') });
      p.boxerLog = JSON.parse(JSON.stringify(B));
      delete p.draftBoxer;
    });
  }

  /* ---------- events ---------- */
  function current() { var m = location.hash.match(/#\/trainer\/(edit|log|boxer)\/([^/]+)/); return m ? plan(m[2]) : null; }
  function updateTotal(p) { var el = document.getElementById('trTotal'); if (el) el.textContent = '≈ ' + total(p) + ' min · saved automatically'; }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tr]');
    if (!b) return;
    var act = b.dataset.tr, p = current(), i = +b.dataset.ex;
    if (act === 'role') { Store.update(function (s) { s.settings.role = b.dataset.v; }); App.rerender(); return; }
    if (act === 'new') {
      var id = 'p' + Date.now().toString(36);
      st().plans.push({ id: id, name: '', boxer: '', date: todayIso(), exercises: [newExercise('warmup'), newExercise('pads'), newExercise('cooldown')] });
      st().plans[st().plans.length - 1].exercises.forEach(syncPlan);
      save(); location.hash = '#/trainer/edit/' + id; return;
    }
    if (act === 'save-log') { saveCoachLog(plan(b.dataset.id)); location.hash = '#/trainer'; return; }
    if (act === 'release') { var rp = plan(b.dataset.id); saveCoachLog(rp); rp.released = todayIso(); save(); location.hash = '#/trainer'; return; }
    if (act === 'boxer-save') { saveBoxerLog(plan(b.dataset.id)); location.hash = '#/trainer'; return; }
    if (!p) return;
    if (act === 'run') { App.runSession(toSession(p)); return; }
    if (act === 'add') {
      var ex = newExercise(b.dataset.cat); syncPlan(ex);
      var lastEx = p.exercises[p.exercises.length - 1];
      if (lastEx && lastEx.cat === 'cooldown' && ex.cat !== 'cooldown') p.exercises.splice(p.exercises.length - 1, 0, ex); else p.exercises.push(ex);
    }
    else if (act === 'up' && i > 0) p.exercises.splice(i - 1, 0, p.exercises.splice(i, 1)[0]);
    else if (act === 'down' && i < p.exercises.length - 1) p.exercises.splice(i + 1, 0, p.exercises.splice(i, 1)[0]);
    else if (act === 'del') p.exercises.splice(i, 1);
    else if (act === 'autofill') autofill(p.exercises[i]);
    else if (act === 'delete-plan') {
      if (!confirm('Delete this plan?')) return;
      st().plans = st().plans.filter(function (x) { return x !== p; });
      Store.update(function (s) { s.log = s.log.filter(function (l) { return l.trainerPlan !== p.id; }); });
      location.hash = '#/trainer'; return;
    }
    if (p.draftLog && p.exercises.length !== p.draftLog.results.length) delete p.draftLog;
    save(); App.rerender();
    if (act === 'add') { var cards = document.querySelectorAll('main section.card[aria-label^="Exercise"]'); var lc = p.exercises.indexOf(ex); if (cards[lc]) cards[lc].scrollIntoView({ block: 'center' }); }
  });

  function onField(t, isChange) {
    var p = current();
    if (!p) return;
    var f = t.dataset.f, v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.dataset.p) { p[t.dataset.p] = v; save(); return; }
    if (t.dataset.b) { p.draftBoxer[t.dataset.b] = t.dataset.b === 'effort' ? +v : v; if (t.dataset.b === 'effort') document.getElementById('bxEff').textContent = v; save(); return; }
    if (t.dataset.l) { p.draftLog[t.dataset.l] = t.dataset.l === 'effort' ? +v : v; if (t.dataset.l === 'effort') document.getElementById('trEff').textContent = v; save(); return; }
    if (t.dataset.lx !== undefined) {
      var r = p.draftLog.results[+t.dataset.lx];
      r[f] = t.type === 'number' ? (v === '' ? '' : +v) : v; save();
      if (f === 'done' && isChange) App.rerender();
      return;
    }
    if (t.dataset.rp) { var rc = t.dataset.rp.split(':'); var exr = p.exercises[+t.dataset.ex]; syncPlan(exr); exr.plan[+rc[0]][+rc[1]] = v; save(); return; }
    if (t.dataset.ex === undefined || !f) return;
    var ex = p.exercises[+t.dataset.ex];
    ex[f] = t.type === 'number' ? (v === '' ? '' : +v) : v;
    if (f === 'cat') { var c = cat(v); ex.activity = c.activities[0]; ex.measure = c.measure; }
    syncPlan(ex);
    if (p.draftLog) delete p.draftLog;
    save(); updateTotal(p);
    if ((isChange && (f === 'cat' || f === 'activity' || f === 'measure')) || (!isChange && (f === 'rounds' || f === 'roundMin') && t.value !== '')) {
      var focusSel = '[data-ex="' + t.dataset.ex + '"][data-f="' + f + '"]';
      App.rerender();
      if (f === 'activity' && v === OTHER) { var inp = document.querySelector('[data-ex="' + t.dataset.ex + '"][data-f="custom"]'); if (inp) inp.focus(); }
      else if (!isChange) { var back2 = document.querySelector(focusSel); if (back2) { back2.focus(); try { var l = back2.value.length; back2.setSelectionRange && back2.type === 'text' && back2.setSelectionRange(l, l); } catch (e2) {} } }
    }
  }
  document.addEventListener('input', function (e) { var t = e.target; if (t.closest && t.closest('main') && t.tagName !== 'SELECT' && t.type !== 'checkbox') onField(t, false); });
  document.addEventListener('change', function (e) { var t = e.target; if (t.tagName === 'SELECT' || t.type === 'checkbox') onField(t, true); });

  return {
    render: function (parts) {
      if (parts[0] === 'edit') return editScreen(parts[1]);
      if (parts[0] === 'log') return logScreen(parts[1]);
      if (parts[0] === 'boxer') return boxerScreen(parts[1]);
      return listScreen();
    }
  };
})();
