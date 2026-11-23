/* Boxing app – screens, navigation and the round timer. */
(function () {
  var D = APP_DATA;
  var main = document.getElementById('app');
  var navEl = document.getElementById('nav');
  var figs = [];
  var ui = { filter: 'All', weekView: {}, demoMove: 'jab', demoSpeed: 1, current: null, timer: null };
  var NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function moveName(m) { return D.MOVES[m] ? D.MOVES[m].name : m; }
  function comboText(c) { return c.map(moveName).join(', '); }
  function keyMove(c) { return c.filter(function (m) { return m !== 'jab'; })[0] || c[0]; }
  /* Which combo (index) is used in each minute of a round, for the current round length. */
  function minuteMap(r) {
    var M = Math.max(1, Math.round(Store.get().settings.roundSec / 60)), L = r.combos.length, out = [];
    for (var m = 0; m < M; m++) out.push(M > 1 ? Math.round(m * (L - 1) / (M - 1)) : 0);
    return out;
  }
  function fmt(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function shortDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  var ICON = {
    today: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',
    plans: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    timer: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
    progress: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/></svg>',
    tick: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#121212" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    bigPlay: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
    bigPause: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    restart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    skip: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5l10 7-10 7z"/><path d="M19 5v14"/></svg>',
    speaker: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    mute: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9l5 6M21 9l-5 6"/></svg>'
  };
  function fig(move, size, extra) { return '<div class="fig" data-move="' + move + '" data-size="' + size + '"' + (extra || '') + '></div>'; }
  function backBtn(href, label) { return '<a class="icon-btn back" href="' + href + '" aria-label="' + label + '">' + ICON.back + '</a>'; }

  /* ---------- screens ---------- */
  function screenToday() {
    var now = new Date();
    var hr = now.getHours();
    var greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    var st = Store.get();
    var mon = Plans.mondayOf(now);
    var strip = '';
    var weekRounds = 0, weekPush = 0, weekSessions = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(mon); d.setDate(d.getDate() + i);
      var di = Plans.iso(d);
      var entries = st.log.filter(function (l) { return l.date === di; });
      entries.forEach(function (l) { weekRounds += l.rounds || 0; weekPush += l.pushups || 0; weekSessions++; });
      var isToday = di === Plans.iso(now);
      var dot = entries.length ? '<span class="dot done" aria-label="Trained">' + ICON.tick + '</span>' : isToday ? '<span class="dot today" aria-label="Today"></span>' : '<span class="dot" aria-label="No session"></span>';
      strip += '<div class="day"><span class="muted small">' + DOW[i].charAt(0) + '</span>' + dot + '</div>';
    }
    var a = Plans.active();
    var card;
    if (!a) {
      card = '<section class="card stack"><p class="eyebrow">Get started</p><h2 class="h2">Pick a training plan</h2><p class="muted">Five programmes mixing offence, defence, movement and fitness.</p><a class="btn-primary" href="#/plans">Browse plans</a></section>';
    } else {
      var td = Plans.today();
      if (!td.session) {
        card = '<section class="card stack"><p class="eyebrow">Week ' + td.week + ' of ' + a.plan.weeks + '</p><h2 class="h2">Week complete</h2><p class="muted">Every session this week is logged. Rest up, or do a free round session.</p><a class="btn-primary" href="#/programme/' + a.plan.id + '">View programme</a></section>';
      } else {
        var s = td.session, b = Plans.build(s), done = Plans.isDone(s);
        card = '<section class="card stack"><p class="eyebrow">' + (td.isToday ? 'Today' : 'Next up') + ' · Week ' + td.week + ' of ' + a.plan.weeks + '</p>' +
          '<div class="stack-s"><h2 class="h2">' + esc(s.title) + '</h2><p class="muted">' + s.minutes + ' min · ' + b.rounds.length + ' rounds · ' + a.plan.level + '</p></div>' +
          '<div class="chips">' + s.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>' +
          (done ? '<p class="muted">Done today. Nice work.</p>' : '') +
          '<a class="btn-primary" href="#/session/' + s.planId + '/' + s.week + '/' + s.slot + '">' + (done ? 'Train it again' : 'Start session') + '</a></section>';
      }
    }
    var planned = a ? a.plan.days.length : 0;
    return '<main class="screen stack-l">' +
      '<header class="row between"><div class="stack-s"><p class="muted small">' + now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '</p><h1 class="h1">' + greet + '</h1></div></header>' +
      '<section class="card week-strip" aria-label="This week">' + strip + '</section>' + card +
      '<section class="stack"><h2 class="h3">This week</h2><div class="grid3">' +
      '<div class="stat"><span class="num">' + weekRounds + '</span><span class="muted small">Rounds</span></div>' +
      '<div class="stat"><span class="num">' + weekSessions + (planned ? '/' + planned : '') + '</span><span class="muted small">Sessions</span></div>' +
      '<div class="stat"><span class="num">' + weekPush + '</span><span class="muted small">Push-ups</span></div></div></section>' +
      '<a class="list-row" href="#/session/free"><span class="tile">' + ICON.timer + '</span><span class="grow stack-xs"><span class="b">Free training</span><span class="muted small">6 mixed rounds · voice coach · 3 min rounds</span></span>' + ICON.chev + '</a>' +
      '</main>';
  }

  function screenPlans() {
    var a = Store.get().activePlan;
    var labels = ['All', 'Offence', 'Defence', 'Movement', 'Fitness'];
    var chips = labels.map(function (l) { return '<button class="chip' + (ui.filter === l ? ' on' : '') + '" data-action="filter" data-v="' + l + '" aria-pressed="' + (ui.filter === l) + '">' + l + '</button>'; }).join('');
    var cards = D.PLANS.filter(function (p) { return ui.filter === 'All' || p.tags.indexOf(ui.filter) > -1; }).map(function (p) {
      var isActive = a && a.id === p.id;
      var total = p.weeks * p.days.length;
      var foot = isActive
        ? '<div class="row"><div class="bar grow" aria-hidden="true"><span style="width:' + Math.round(Plans.doneCount(p.id) / total * 100) + '%"></span></div><span class="accent small b">Week ' + Plans.currentWeek(Plans.active()) + ' of ' + p.weeks + '</span></div>'
        : '<span class="small">' + p.weeks + ' weeks · ' + p.days.length + ' sessions a week</span>';
      return '<a class="card stack-s plain" href="#/programme/' + p.id + '"><div class="row between"><h2 class="h2 sm">' + esc(p.name) + '</h2><span class="muted small nowrap">' + p.level + '</span></div><p class="muted small">' + esc(p.desc) + '</p>' + foot + '</a>';
    }).join('');
    return '<main class="screen stack"><div class="stack-s"><h1 class="h1">Plans</h1><p class="muted">Programmes that mix technique, defence and fitness</p></div>' +
      '<div class="chips scroll" role="group" aria-label="Filter plans">' + chips + '</div>' + cards + '</main>';
  }

  function screenProgramme(id) {
    var p = Plans.byId(id);
    if (!p) return screenPlans();
    var a = Plans.active();
    var isActive = a && a.plan.id === id;
    var wk = ui.weekView[id] || (isActive ? Plans.currentWeek(a) : 1);
    var total = p.weeks * p.days.length, done = Plans.doneCount(id);
    var weeks = '';
    for (var w = 1; w <= p.weeks; w++) {
      var cls = w === wk ? ' on' : (isActive && w < Plans.currentWeek(a)) ? ' past' : '';
      weeks += '<button class="wk' + cls + '" data-action="week" data-plan="' + id + '" data-v="' + w + '" aria-pressed="' + (w === wk) + '" aria-label="Week ' + w + ', ' + p.phases[w] + '">' + w + '</button>';
    }
    var sessions = Plans.weekSessions(p, wk);
    var rows = '';
    var todayIso = Plans.iso(new Date());
    for (var i = 0; i < 7; i++) {
      var s = sessions.filter(function (x) { return x.dayIdx === i; })[0];
      var date = isActive ? Plans.dateFor(a, wk, i) : null;
      var dnum = date ? date.getDate() : (i + 1);
      var isToday = date && Plans.iso(date) === todayIso;
      if (s) {
        var dn = Plans.isDone(s);
        rows += '<a class="day-row' + (isToday ? ' today' : '') + '" href="#/session/' + id + '/' + wk + '/' + s.slot + '">' +
          '<span class="dcol"><span class="small ' + (isToday ? 'accent b' : 'muted') + '">' + DOW[i] + '</span><span class="dnum">' + dnum + '</span></span>' +
          '<span class="grow stack-xs"><span class="b">' + esc(s.title) + '</span><span class="muted small">' + s.tags.join(' · ') + ' · ' + s.minutes + ' min</span></span>' +
          (isToday ? '<span class="pill">Today</span>' : dn ? '<span class="dot done" aria-label="Done">' + ICON.tick + '</span>' : '<span class="dot ring" aria-label="Not done yet"></span>') + '</a>';
      } else {
        rows += '<div class="day-row rest"><span class="dcol"><span class="muted small">' + DOW[i] + '</span><span class="dnum muted">' + dnum + '</span></span><span class="muted small">' + (i === 5 ? 'Rest or optional 5 km easy run' : 'Rest') + '</span></div>';
      }
    }
    var range = '';
    if (isActive) { var s0 = Plans.dateFor(a, wk, 0), s6 = Plans.dateFor(a, wk, 6); range = shortDate(s0) + ' – ' + shortDate(s6); }
    var head = isActive
      ? '<div class="row"><div class="bar grow" aria-hidden="true"><span style="width:' + Math.round(done / total * 100) + '%"></span></div><span class="muted small nowrap">' + done + ' of ' + total + ' sessions</span></div>'
      : '<button class="btn-primary" data-action="start-plan" data-plan="' + id + '">Start this plan this week</button>';
    return '<main class="screen stack">' + backBtn('#/plans', 'Back to plans') +
      '<div class="stack-s"><p class="eyebrow">' + (isActive ? 'Your programme' : 'Programme') + ' · ' + p.level + '</p><h1 class="h1">' + esc(p.name) + '</h1><p class="muted small">' + esc(p.desc) + '</p></div>' + head +
      '<section class="stack-s"><div class="row between"><h2 class="h3">Week ' + wk + ' · ' + p.phases[wk] + '</h2><span class="muted small">' + range + '</span></div><div class="chips scroll" role="group" aria-label="Choose a week">' + weeks + '</div></section>' +
      '<section class="stack-xs" aria-label="Sessions this week">' + rows + '</section></main>';
  }

  function screenSession(parts) {
    var s;
    if (parts[0] === 'free') s = Plans.freeSession();
    else {
      var p = Plans.byId(parts[0]);
      if (!p) return screenToday();
      s = Plans.weekSessions(p, +parts[1])[+parts[2]];
    }
    var b = Plans.build(s);
    ui.current = b;
    var mins = minuteMap(b.warm);
    var warm = row(b.warm.combos[0][0], 'Warm-up round', mins.map(function (ci, m) { return '<span class="ladder"><b>Min ' + (m + 1) + '</b> ' + esc(b.warm.texts[ci]) + '</span>'; }).join(''));
    var rounds = b.rounds.map(function (r) {
      return row(keyMove(r.combos[r.combos.length - 1]), 'Round ' + r.n + ' · ' + r.focus, minuteMap(r).map(function (ci, m) { return '<span class="ladder"><b>Min ' + (m + 1) + '</b> ' + esc(comboText(r.combos[ci])) + '</span>'; }).join(''));
    }).join('');
    var cond = row('pushup', 'Conditioning', esc(b.conditioning.join(' · ')));
    function row(move, name, detailHtml) {
      return '<a class="list-row" href="#/demo/' + move + '">' + fig(move, 56) + '<span class="grow stack-xs"><span class="b">' + esc(name) + '</span><span class="muted small stack-xs">' + detailHtml + '</span></span><span class="muted">' + ICON.play + '</span></a>';
    }
    var back = s.planId ? '#/programme/' + s.planId : '#/today';
    return '<main class="screen stack with-cta">' + backBtn(back, 'Back') +
      '<div class="stack-s"><p class="eyebrow">' + (s.planId ? 'Week ' + s.week + ' · Session ' + (s.slot + 1) : 'Free training') + '</p><h1 class="h1">' + esc(s.title) + '</h1>' +
      '<p class="muted small">' + s.minutes + ' min · ' + b.rounds.length + ' rounds of ' + fmt(Store.get().settings.roundSec) + ' · ' + fmt(Store.get().settings.restSec) + ' rest · Tap a move to watch it</p></div>' +
      '<section class="stack-s"><div class="row between"><h2 class="label">Warm-up</h2><span class="muted small">1 round</span></div>' + warm + '</section>' +
      '<section class="stack-s"><div class="row between"><h2 class="label">Rounds</h2><span class="muted small">' + (b.levelUp ? 'Level up: harder combos' : 'New combo each minute') + '</span></div>' + rounds + '</section>' +
      '<section class="stack-s"><div class="row between"><h2 class="label">Finish</h2><span class="muted small">10 min</span></div>' + cond + '</section>' +
      '<div class="cta"><a class="btn-primary" href="#/timer/go">Start warm-up round</a></div></main>';
  }

  function screenDemo(move) {
    if (move && D.MOVES[move]) ui.demoMove = move;
    var m = D.MOVES[ui.demoMove];
    var chips = D.MOVE_ORDER.map(function (k) { return '<button class="chip' + (k === ui.demoMove ? ' on' : '') + '" data-action="demo-move" data-v="' + k + '" aria-pressed="' + (k === ui.demoMove) + '">' + D.MOVES[k].name + '</button>'; }).join('');
    var speeds = [[0.5, '0.5× slow-mo'], [1, '1×']].map(function (s) { return '<button class="seg-btn' + (ui.demoSpeed === s[0] ? ' on' : '') + '" data-action="demo-speed" data-v="' + s[0] + '" aria-pressed="' + (ui.demoSpeed === s[0]) + '">' + s[1] + '</button>'; }).join('');
    return '<main class="screen stack"><div class="row between">' + '<button class="icon-btn back" data-action="back" aria-label="Back">' + ICON.back + '</button><div class="seg" role="group" aria-label="Playback speed">' + speeds + '</div></div>' +
      '<div class="center">' + fig(ui.demoMove, 300, ' data-speed="' + ui.demoSpeed + '"') + '</div>' +
      '<div class="stack-xs"><p class="eyebrow">' + m.cat + '</p><h1 class="h1">' + m.name + '</h1></div>' +
      '<div class="chips scroll" role="group" aria-label="Choose a move">' + chips + '</div>' +
      '<section class="card stack-s"><h2 class="h3">Coaching points</h2>' + m.cues.map(function (c, i) { return '<div class="row top"><span class="num-badge">' + (i + 1) + '</span><span>' + esc(c) + '</span></div>'; }).join('') +
      '<p class="muted small">Watch out: ' + esc(m.fault) + '</p></section></main>';
  }

  function screenProgress() {
    var st = Store.get();
    if (!st.log.length) {
      return '<main class="screen stack-l"><h1 class="h1">Progress</h1><section class="card stack"><h2 class="h2">No sessions logged yet</h2><p class="muted">Finish a session with the round timer and log it. Your rounds, push-ups and training balance will show up here.</p>' +
        '<a class="btn-primary" href="#/plans">Pick a plan</a><button class="btn-ghost" data-action="sample">Load sample data to try it out</button></section></main>';
    }
    var mon = Plans.mondayOf(new Date());
    var weeks = [];
    for (var i = 7; i >= 0; i--) {
      var s = new Date(mon); s.setDate(s.getDate() - i * 7);
      var e = new Date(s); e.setDate(e.getDate() + 7);
      var r = st.log.filter(function (l) { var d = Plans.parse(l.date); return d >= s && d < e; }).reduce(function (n, l) { return n + (l.rounds || 0); }, 0);
      weeks.push({ label: shortDate(s), r: r });
    }
    var max = Math.max.apply(null, weeks.map(function (w) { return w.r; }).concat([1]));
    var bars = weeks.map(function (w, i) { return '<div class="barcol"><div class="vbar' + (i === 7 ? ' now' : '') + '" style="height:' + Math.round(w.r / max * 88) + 'px"></div><span class="muted xs">W' + (i + 1) + '</span></div>'; }).join('');
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    var bal = { Offence: 0, Defence: 0, Movement: 0, Fitness: 0 };
    st.log.forEach(function (l) { if (Plans.parse(l.date) >= cutoff) l.tags.forEach(function (t) { bal[t] += (l.rounds || 0) / l.tags.length; }); });
    var bmax = Math.max(1, bal.Offence, bal.Defence, bal.Movement, bal.Fitness);
    var low = Object.keys(bal).sort(function (x, y) { return bal[x] - bal[y]; })[0];
    var suggest = { Offence: 'power', Defence: 'defence', Movement: 'footwork', Fitness: 'fitness' }[low];
    var balRows = Object.keys(bal).map(function (k) { return '<div class="stack-xs"><div class="row between"><span class="small">' + k + '</span><span class="muted small">' + Math.round(bal[k]) + ' rounds</span></div><div class="bar" aria-hidden="true"><span style="width:' + Math.round(bal[k] / bmax * 100) + '%"></span></div></div>'; }).join('');
    var bestPush = Math.max.apply(null, st.log.map(function (l) { return l.pushups || 0; }));
    var wts = st.weights.slice().sort(function (x, y) { return x.date < y.date ? -1 : 1; });
    var wNow = wts.length ? wts[wts.length - 1].kg : null;
    var totalRounds = st.log.reduce(function (n, l) { return n + (l.rounds || 0); }, 0);
    var recent = st.log.slice().sort(function (x, y) { return x.date < y.date ? 1 : -1; }).slice(0, 5).map(function (l) {
      return '<div class="row between small"><span>' + shortDate(Plans.parse(l.date)) + ' · ' + esc(l.title) + '</span><span class="muted nowrap">' + l.rounds + ' rds · effort ' + l.effort + '/10</span></div>';
    }).join('');
    return '<main class="screen stack"><h1 class="h1">Progress</h1>' +
      '<section class="card stack-s"><div class="row between"><h2 class="h3">Rounds per week</h2><span class="accent small b">' + weeks[7].r + ' this week</span></div>' +
      '<div class="bars" role="img" aria-label="Rounds per week over 8 weeks: ' + weeks.map(function (w) { return w.r; }).join(', ') + '">' + bars + '</div></section>' +
      '<section class="card stack-s"><h2 class="h3">Training balance, last 30 days</h2>' + balRows +
      '<p class="muted small">' + low + ' is lagging. Try <a href="#/programme/' + suggest + '">' + esc(Plans.byId(suggest).name) + '</a>.</p></section>' +
      '<section class="grid2"><div class="stat"><span class="muted small">Most push-ups in a session</span><span class="num">' + bestPush + '</span></div>' +
      '<div class="stat"><span class="muted small">Body weight</span><span class="num">' + (wNow ? wNow + ' kg' : '–') + '</span></div>' +
      '<div class="stat"><span class="muted small">Sessions logged</span><span class="num">' + st.log.length + '</span></div>' +
      '<div class="stat"><span class="muted small">Total rounds</span><span class="num">' + totalRounds + '</span></div></section>' +
      '<section class="card stack-s"><h2 class="h3">Recent sessions</h2>' + recent + '</section>' +
      '<button class="btn-link" data-action="clear">Clear all my data</button></main>';
  }

  function screenLog() {
    var b = ui.current;
    if (!b) return screenToday();
    var t = ui.timer;
    var rounds = t ? Math.min(b.rounds.length, t.completed) : b.rounds.length;
    return '<main class="screen stack-l">' + backBtn('#/timer', 'Back to timer') +
      '<div class="stack-s"><p class="eyebrow">Log session</p><h1 class="h1">' + esc(b.info.title) + '</h1></div>' +
      '<form class="card stack" id="logForm">' +
      '<label class="field"><span>Rounds completed</span><input type="number" name="rounds" min="0" max="20" value="' + rounds + '" required></label>' +
      '<label class="field"><span>How hard was it? <b id="effOut">7</b>/10</span><input type="range" name="effort" min="1" max="10" value="7"></label>' +
      '<label class="field"><span>Push-ups done</span><input type="number" name="pushups" min="0" max="2000" value="0"></label>' +
      '<label class="field"><span>Body weight in kg (optional)</span><input type="number" name="kg" min="30" max="250" step="0.1" placeholder="e.g. 78.4"></label>' +
      '<label class="field"><span>Notes</span><textarea name="notes" rows="3" placeholder="What felt good, what to work on"></textarea></label>' +
      '<button class="btn-primary" type="submit">Save session</button></form></main>';
  }

  /* ---------- timer ---------- */
  function screenTimer() {
    if (!ui.current) ui.current = Plans.build(Plans.freeSession());
    var b = ui.current;
    if (!ui.timer || ui.timer.session !== b) ui.timer = { session: b, phase: 'round', i: 0, t: 0, running: false, completed: 0, id: null };
    var st = Store.get().settings;
    var voiceOpts = Coach.voices().map(function (v) { return '<option value="' + esc(v.name) + '"' + (v.name === st.voiceName ? ' selected' : '') + '>' + esc(v.name.replace(/^Microsoft |^Google /, '').replace(/ - English.*$/, '')) + ' (' + v.lang + ')</option>'; }).join('');
    return '<main class="screen timer stack">' +
      '<div class="row between"><button class="icon-btn back" data-action="close-timer" aria-label="Close timer">' + ICON.close + '</button><p class="label center grow" id="tHead"></p>' +
      '<button class="icon-btn voice" id="tVoice" data-action="voice" aria-label="Voice coach"></button></div>' +
      '<div class="center rel">' + fig('guard', 210, ' id="tFig"') + '<div class="countdown" id="tCount" hidden></div></div>' +
      '<div class="clock" role="timer" id="tClock">0:00</div><div class="bar" aria-hidden="true"><span id="tBar"></span></div>' +
      '<section class="card stack-s"><span class="label" id="tCardTitle"></span><div class="chips" id="tCombo"></div><div class="stack-xs" id="tNext" aria-live="polite"></div>' +
      '<div class="row between"><span class="muted small">Coach calls</span><div class="seg" role="group" aria-label="When the coach calls combinations">' +
      '<button class="seg-btn" data-action="calls" data-v="start" id="cStart">Each minute</button><button class="seg-btn" data-action="calls" data-v="all" id="cAll">Keep calling</button></div></div>' +
      '<details><summary class="muted small">Timer and voice settings</summary><div class="stack-s pad-t">' +
      '<label class="row between small"><span>Coach voice</span><select data-action="voice-name" class="select">' + (voiceOpts || '<option value="">Device default</option>') + '</select></label>' +
      '<label class="row between small"><span>Round length</span><select data-action="round-len" class="select"><option value="120"' + (st.roundSec === 120 ? ' selected' : '') + '>2 min</option><option value="180"' + (st.roundSec === 180 ? ' selected' : '') + '>3 min</option></select></label>' +
      '<label class="row between small"><span>Rest</span><select data-action="rest-len" class="select"><option value="30"' + (st.restSec === 30 ? ' selected' : '') + '>30 s</option><option value="60"' + (st.restSec === 60 ? ' selected' : '') + '>1 min</option></select></label>' +
      '</div></details></section>' +
      '<div class="controls"><button class="round-btn" data-action="t-reset" aria-label="Restart this round or rest">' + ICON.restart + '</button>' +
      '<button class="play-btn" id="tPlay" data-action="t-toggle" aria-label="Start"></button>' +
      '<button class="round-btn" id="tSkip" data-action="t-skip" aria-label="End round">' + ICON.skip + '</button></div>' +
      '<a class="btn-primary" id="tLog" href="#/log" hidden>Log this session</a></main>';
  }

  var T = {
    cfg: function () { var s = Store.get().settings; return { ROUND: s.roundSec, REST: s.restSec, WIN: 8 }; },
    dur: function (phase) { var c = T.cfg(); return phase === 'round' ? c.ROUND : c.REST; },
    rnd: function (i) { return ui.timer.session.all[i]; },
    total: function () { return ui.timer.session.rounds.length; },
    minute: function (t) { return Math.min(minuteMap(T.rnd(0)).length - 1, Math.floor(t / 60)); },
    comboIdx: function (i, t) { return minuteMap(T.rnd(i))[T.minute(t)]; },
    combo: function (i, t) { return T.rnd(i).combos[T.comboIdx(i, t)]; },
    label: function (i, ci) { var r = T.rnd(i); return r.texts ? r.texts[ci] : comboText(r.combos[ci]); },
    ordinal: ['one', 'two', 'three', 'four', 'five'],
    ladder: function (i) {
      return minuteMap(T.rnd(i)).map(function (ci, m) { return 'Minute ' + T.ordinal[m] + ': ' + T.label(i, ci) + '.'; }).join(' ');
    },
    brief: function (i) {
      var r = T.rnd(i);
      if (r.warm) return 'Warm-up round. ' + T.ladder(i);
      return 'Round ' + (NUM_WORDS[r.n] || r.n) + '. ' + r.focus + '. ' + T.ladder(i);
    },
    cue: function () {
      var tm = ui.timer, c = T.cfg(), calls = Store.get().settings.calls, r = T.rnd(tm.i);
      if (tm.phase === 'round') {
        var left = c.ROUND - tm.t;
        if (left === 10) { Coach.speak(r.warm ? 'Ten seconds, then a short rest.' : 'Ten seconds! Let your hands go!'); return; }
        if (tm.t > 0 && tm.t % 60 === 0) { Coach.speak('Minute ' + T.ordinal[T.minute(tm.t)] + '. ' + T.label(tm.i, T.comboIdx(tm.i, tm.t)) + '.'); return; }
        if (calls === 'all' && !r.warm && tm.t % 15 === 0 && tm.t % 60 !== 0) Coach.speak(comboText(T.combo(tm.i, tm.t)));
      } else if (tm.phase === 'rest') {
        var rl = c.REST - tm.t;
        if (rl === Math.min(45, c.REST - 8)) Coach.speak(T.brief(tm.i + 1));
        else if (rl === 10) Coach.speak('Ten seconds. Gloves up, get on your toes.');
        else if (rl <= 3 && rl >= 1) Coach.speak(['', 'One', 'Two', 'Three'][rl]);
      }
    },
    advance: function () {
      var tm = ui.timer, n = T.total();
      if (tm.phase === 'round') {
        tm.completed = Math.max(tm.completed, tm.i);
        if (tm.i >= n) { T.stop(); tm.phase = 'done'; tm.t = 0; Coach.speak('Time! That is the session done. Great work. Walk it off and stretch.'); }
        else { tm.phase = 'rest'; tm.t = 0; Coach.speak(T.rnd(tm.i).warm ? 'Good. Warm-up done. Short rest, then round one.' : 'Time! Rest. Walk it off, shake out your arms and breathe.'); }
      } else if (tm.phase === 'rest') {
        tm.i++; tm.phase = 'round'; tm.t = 0;
        Coach.speak('Box! Minute one: ' + T.label(tm.i, T.comboIdx(tm.i, 0)) + '.');
      }
      T.paint();
    },
    start: function () {
      var tm = ui.timer;
      if (tm.phase === 'done') { tm.phase = 'round'; tm.i = 0; tm.t = 0; tm.completed = 0; }
      if (tm.phase === 'round' && tm.t === 0) Coach.speak(T.rnd(tm.i).warm ? T.brief(0) + ' Let\'s go.' : 'Box! Minute one: ' + T.label(tm.i, T.comboIdx(tm.i, 0)) + '.');
      else if (tm.phase === 'round') Coach.speak(T.label(tm.i, T.comboIdx(tm.i, tm.t)) + '.');
      tm.running = true;
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { tm.lock = l; }).catch(function () {}); } catch (e) {}
      tm.id = setInterval(function () {
        tm.t++;
        if (tm.t >= T.dur(tm.phase)) { T.advance(); return; }
        T.cue(); T.paint();
      }, 1000);
      T.paint();
    },
    stop: function () { var tm = ui.timer; if (tm && tm.id) { clearInterval(tm.id); tm.id = null; } if (tm) { tm.running = false; if (tm.lock) { try { tm.lock.release(); } catch (e) {} tm.lock = null; } } },
    paint: function () {
      var tm = ui.timer;
      var el = function (id) { return document.getElementById(id); };
      if (!el('tClock')) return;
      var c = T.cfg(), n = T.total(), st = Store.get().settings;
      var inRound = tm.phase === 'round', inRest = tm.phase === 'rest', done = tm.phase === 'done';
      var r = T.rnd(tm.i), warm = inRound && r.warm;
      var dur = T.dur(tm.phase);
      var left = done ? 0 : Math.max(0, dur - tm.t);
      var nextI = tm.i + 1;
      el('tHead').textContent = done ? 'Session complete' : inRest ? 'Rest · Round ' + T.rnd(nextI).n + ' next' : warm ? 'Warm-up round' : 'Round ' + r.n + ' of ' + n + ' · ' + r.focus;
      el('tHead').classList.toggle('rest', inRest);
      el('tClock').textContent = done ? 'Done' : fmt(left);
      el('tClock').classList.toggle('rest', inRest);
      el('tBar').style.width = (done ? 100 : Math.round(tm.t / dur * 100)) + '%';
      el('tBar').classList.toggle('rest', inRest);
      var mins = minuteMap(r);
      var mi = inRound ? T.minute(tm.t) : 0;
      var combo = inRound ? T.combo(tm.i, tm.t) : [];
      var step = Math.min(1.8, (c.WIN - 0.5) / Math.max(1, combo.length));
      var idx = Math.min(combo.length - 1, Math.floor((tm.t % c.WIN) / step));
      var f = el('tFig'); if (f && f._fig) { f._fig.setMove(inRound ? combo[idx] : 'step'); f._fig.setSpeed(inRound ? (warm ? 0.7 : 1) : 0.6); }
      var cd = el('tCount'); var showCd = inRest && left <= 3 && left > 0; cd.hidden = !showCd; cd.textContent = left;
      el('tCardTitle').textContent = inRound ? 'Minute ' + (mi + 1) + ' of ' + mins.length + (r.texts ? ' · ' + r.texts[T.comboIdx(tm.i, tm.t)] : '') : inRest ? 'Next round · ' + T.rnd(nextI).focus : 'Well done';
      el('tCombo').innerHTML = combo.map(function (m, i) { return '<span class="cchip' + (i === idx ? ' on' : '') + '">' + moveName(m) + '</span>'; }).join('');
      function ladderHtml(i, current) {
        return minuteMap(T.rnd(i)).map(function (ci, m) {
          return '<span class="ladder' + (m === current ? ' now' : m < current ? ' past' : '') + '"><b>Min ' + (m + 1) + '</b> ' + esc(T.label(i, ci)) + '</span>';
        }).join('');
      }
      el('tNext').innerHTML = done ? '<span class="small">All rounds complete. Cool down: 5 min easy footwork, then stretch shoulders, hips and calves.</span>'
        : inRest ? '<span class="muted small">Walk it off and breathe. The coach reads these out, then counts you in:</span>' + ladderHtml(nextI, -1)
        : ladderHtml(tm.i, mi);
      el('tPlay').innerHTML = tm.running ? ICON.bigPause : ICON.bigPlay;
      el('tPlay').setAttribute('aria-label', tm.running ? 'Pause' : (tm.t === 0 && tm.i === 0 && inRound ? 'Start warm-up round' : 'Start'));
      el('tSkip').setAttribute('aria-label', inRest ? 'Skip rest' : warm ? 'End warm-up' : 'End round');
      var v = el('tVoice'); v.innerHTML = st.voice ? ICON.speaker : ICON.mute; v.classList.toggle('on', st.voice); v.setAttribute('aria-pressed', st.voice);
      el('cStart').classList.toggle('on', st.calls === 'start'); el('cAll').classList.toggle('on', st.calls === 'all');
      el('tLog').hidden = !(done || tm.completed > 0);
      el('tLog').setAttribute('href', tm.session.info.trainerPlan ? '#/trainer/log/' + tm.session.info.trainerPlan : '#/log');
    }
  };

  /* ---------- sample data ---------- */
  function loadSample() {
    Store.update(function (s) {
      var mon = Plans.mondayOf(new Date()); mon.setDate(mon.getDate() - 14);
      s.activePlan = { id: 'defence', start: Plans.iso(mon) };
      s.log = []; s.weights = [];
      var p = Plans.byId('defence'); var a = { plan: p, start: mon };
      var today = new Date(); today.setHours(0, 0, 0, 0); var kg = 80;
      for (var w = 1; w <= 3; w++) {
        Plans.weekSessions(p, w).forEach(function (ss) {
          var d = Plans.dateFor(a, w, ss.dayIdx);
          if (d >= today) return;
          var b = Plans.build(ss);
          s.log.push({ date: Plans.iso(d), planId: 'defence', week: w, slot: ss.slot, title: ss.title, tags: ss.tags, rounds: b.rounds.length, minutes: ss.minutes, effort: 6 + ((w + ss.slot) % 3), pushups: 40 + w * 10 + ss.slot * 5, notes: '' });
          kg -= 0.2; s.weights.push({ date: Plans.iso(d), kg: Math.round(kg * 10) / 10 });
        });
      }
    });
  }

  /* ---------- routing ---------- */
  function route(keep) {
    var parts = (location.hash.replace(/^#\/?/, '') || 'today').split('/');
    var name = parts[0];
    if (name !== 'timer' && ui.timer && ui.timer.running) { T.stop(); Coach.hush(); }
    figs.forEach(function (f) { f.destroy(); }); figs = [];
    var html;
    switch (name) {
      case 'plans': html = screenPlans(); break;
      case 'programme': html = screenProgramme(parts[1]); break;
      case 'session': html = screenSession(parts.slice(1)); break;
      case 'timer': html = screenTimer(); break;
      case 'progress': html = screenProgress(); break;
      case 'demo': html = screenDemo(parts[1]); break;
      case 'log': html = screenLog(); break;
      case 'trainer': html = Trainer.render(parts.slice(1)); break;
      default: name = 'today'; html = screenToday();
    }
    main.innerHTML = html;
    main.querySelectorAll('.fig').forEach(function (el) {
      var f = Figure.mount(el, { move: el.dataset.move, size: +el.dataset.size, speed: +el.dataset.speed || 1 });
      el._fig = f; figs.push(f);
    });
    var tab = { today: 'today', plans: 'plans', programme: 'plans', timer: 'timer', progress: 'progress', trainer: 'trainer' }[name];
    navEl.hidden = !tab || name === 'timer' || (name === 'trainer' && parts.length > 1);
    document.body.classList.toggle('has-nav', !navEl.hidden);
    navEl.querySelectorAll('a').forEach(function (a) { var on = a.dataset.tab === tab; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (name === 'timer') {
      T.paint();
      if (parts[1] === 'go') {
        history.replaceState(null, '', '#/timer');
        var tm = ui.timer;
        if (!tm.running && tm.phase === 'round' && tm.i === 0 && tm.t === 0) T.start();
      }
    }
    if (name === 'log') {
      var form = document.getElementById('logForm');
      form.effort.addEventListener('input', function () { document.getElementById('effOut').textContent = form.effort.value; });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var b = ui.current, info = b.info;
        Store.update(function (s) {
          s.log.push({ date: Plans.iso(new Date()), planId: info.planId, week: info.week, slot: info.slot, title: info.title, tags: info.tags, rounds: +form.rounds.value || 0, minutes: info.minutes, effort: +form.effort.value, pushups: +form.pushups.value || 0, notes: form.notes.value });
          if (form.kg.value) s.weights.push({ date: Plans.iso(new Date()), kg: +form.kg.value });
        });
        ui.timer = null;
        location.hash = '#/progress';
      });
    }
    if (!keep) window.scrollTo(0, 0);
  }
  window.App = {
    rerender: function () { var y = window.scrollY; route(true); window.scrollTo(0, y); },
    runSession: function (b) { if (ui.timer) T.stop(); ui.current = b; ui.timer = null; location.hash = '#/timer/go'; }
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]');
    if (!a) return;
    var act = a.dataset.action, v = a.dataset.v;
    if (act === 'filter') { ui.filter = v; route(); }
    else if (act === 'week') { ui.weekView[a.dataset.plan] = +v; route(); }
    else if (act === 'start-plan') { Plans.start(a.dataset.plan); ui.weekView = {}; route(); }
    else if (act === 'demo-move') { ui.demoMove = v; route(); }
    else if (act === 'demo-speed') { ui.demoSpeed = +v; route(); }
    else if (act === 'back') { history.back(); }
    else if (act === 'sample') { loadSample(); route(); }
    else if (act === 'clear') { if (confirm('Delete all your logged sessions and settings on this device?')) { Store.reset(); route(); } }
    else if (act === 'close-timer') { T.stop(); Coach.hush(); history.back(); }
    else if (act === 't-toggle') { if (ui.timer.running) { T.stop(); Coach.hush(); T.paint(); } else T.start(); }
    else if (act === 't-reset') { ui.timer.t = 0; T.paint(); }
    else if (act === 't-skip') { if (ui.timer.phase !== 'done') T.advance(); }
    else if (act === 'voice') {
      Store.update(function (s) { s.settings.voice = !s.settings.voice; });
      if (Store.get().settings.voice) Coach.speak('Voice coach on.'); else Coach.hush();
      T.paint();
    }
    else if (act === 'calls') { Store.update(function (s) { s.settings.calls = v; }); T.paint(); }
  });
  document.addEventListener('change', function (e) {
    var act = e.target.dataset.action;
    if (act === 'voice-name') { Store.update(function (s) { s.settings.voiceName = e.target.value; }); Coach.speak('Jab, straight, lead hook. Nice and sharp.', true); }
    if (act === 'round-len') { Store.update(function (s) { s.settings.roundSec = +e.target.value; }); T.paint(); }
    if (act === 'rest-len') { Store.update(function (s) { s.settings.restSec = +e.target.value; }); T.paint(); }
  });
  Coach.onVoices(function () {
    Store.update(function (s) { if (!s.settings.voiceName && Coach.voices()[0]) s.settings.voiceName = Coach.voices()[0].name; });
    if ((location.hash || '').indexOf('timer') > -1 && !(ui.timer && ui.timer.running)) route();
  });

  window.addEventListener('hashchange', route);
  route();
})();
