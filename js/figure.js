/* Animated boxer: a jointed 3D skeleton drawn as SVG, seen at a three-quarter angle.
   Usage: var f = Figure.mount(element, { move: 'jab', size: 200, speed: 1 }); f.setMove('hook'); f.destroy(); */
window.Figure = (function () {
  var NS = 'http://www.w3.org/2000/svg';
  var R = Math.PI / 180;
  var SLOTS = 20;
  var live = [];
  var rafId = null, last = 0;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function nrm(a) { var l = Math.sqrt(dot(a, a)) || 1; return mul(a, 1 / l); }
  function lerp(a, b, k) { return add(a, mul(sub(b, a), k)); }
  function bez(a, c, b, k) { return lerp(lerp(a, c, k), lerp(c, b, k), k); }
  function rotY(v, d) { var r = d * R, c = Math.cos(r), s = Math.sin(r); return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c]; }
  function sm(u) { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u); }
  function ik(A, T, L1, L2, pole) {
    var v = sub(T, A); var d = Math.sqrt(dot(v, v));
    var dir = d > 0.0001 ? mul(v, 1 / d) : [0, -1, 0];
    d = Math.min(Math.max(d, 0.05), L1 + L2 - 0.002);
    var a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    var n = nrm(sub(pole, mul(dir, dot(pole, dir))));
    return [add(add(A, mul(dir, a)), mul(n, h)), add(A, mul(dir, d))];
  }

  /* Returns the list of body segments for a move at time t (0–1 through one repetition). */
  function pose(move, t) {
    function env(a, b, c, d) { if (t < a || t >= d) return 0; if (t < b) return sm((t - a) / (b - a)); if (t < c) return 1; return 1 - sm((t - c) / (d - c)); }
    function bump(a, b) { if (t < a || t > b) return 0; return Math.sin(Math.PI * (t - a) / (b - a)); }
    var NEAR = '#F2EFE8', FAR = '#8F8A82', GN = '#F5A524', GF = '#B87A1E', TRUNK = '#5A554D', BODY = '#E3DED5';
    var shapes = [];
    function seg(a, b, w, k) { shapes.push({ p: a, q: b, w: w, k: k }); }
    function dotAt(a, w, k) { shapes.push({ p: a, q: add(a, [0.001, 0, 0]), w: w, k: k }); }
    var cx = 0.15, shadowX = 0;
    var Lh, Rh, Ls, Rs, head, neck, hipC, chest, kL, kR, aL, aR, heelL, heelR, toeL, toeR, eL, eR, gl, gr;

    if (move === 'pushup') {
      cx = -0.12;
      var dn = env(0.1, 0.42, 0.5, 0.85);
      var ys = 0.5 - 0.3 * dn;
      var chestM = [0.42, ys, 0], footM = [-0.82, 0.08, 0];
      Ls = [0.42, ys, -0.18]; Rs = [0.42, ys, 0.18];
      hipC = lerp(footM, chestM, 0.5);
      Lh = add(hipC, [0, 0, -0.12]); Rh = add(hipC, [0, 0, 0.12]);
      aL = [-0.82, 0.08, -0.1]; aR = [-0.82, 0.08, 0.1];
      kL = lerp(aL, Lh, 0.5); kR = lerp(aR, Rh, 0.5);
      toeL = [-0.74, 0, -0.1]; toeR = [-0.74, 0, 0.1];
      heelL = aL; heelR = aR;
      var along = nrm(sub(chestM, footM));
      neck = add(chestM, mul(along, 0.08));
      head = add(add(chestM, mul(along, 0.22)), [0.02, -0.02, 0]);
      chest = chestM;
      var ar = ik(Ls, [0.44, 0.02, -0.26], 0.3, 0.29, [-0.7, 0.4, -0.6]);
      var br = ik(Rs, [0.44, 0.02, 0.26], 0.3, 0.29, [-0.7, 0.4, 0.6]);
      eL = ar[0]; gl = ar[1]; eR = br[0]; gr = br[1];
      shadowX = -0.15;
    } else {
      var beta = 50, gam = 55, px = 0, py = 0.93, lx = 0.04, lz = 0, lH = 0, rH = 0.05, lY = 15, rY = 45;
      var bL = [0.42, 0, -0.1], bR = [-0.22, 0, 0.2];
      var lk = 0, rk = 0, lT = 's', rT = 's', k, dip;
      py += 0.008 * Math.sin(t * Math.PI * 4);
      if (move === 'jab') { k = env(0.2, 0.32, 0.42, 0.62); beta += 10 * k; gam += 18 * k; px += 0.05 * k; lx += 0.03 * k; lk = k; bL = add(bL, [0.06 * k, 0.02 * bump(0.18, 0.32), 0]); }
      if (move === 'cross') { k = env(0.2, 0.34, 0.44, 0.66); beta -= 55 * k; gam -= 70 * k; px += 0.07 * k; lx += 0.07 * k; rH += 0.09 * k; rY -= 45 * k; rk = k; }
      if (move === 'hook') { k = env(0.2, 0.34, 0.44, 0.66); beta += 35 * k; gam += 45 * k; px -= 0.02 * k; lz += 0.03 * k; lH += 0.05 * k; lY += 55 * k; lk = k; lT = 'h'; }
      if (move === 'rearhook') { k = env(0.2, 0.34, 0.44, 0.66); beta -= 50 * k; gam -= 65 * k; px += 0.04 * k; lz -= 0.02 * k; rH += 0.08 * k; rY -= 40 * k; rk = k; rT = 'h'; }
      if (move === 'uppercut') { dip = env(0.06, 0.2, 0.22, 0.34); k = env(0.22, 0.36, 0.44, 0.66); py += -0.1 * dip + 0.02 * k; beta += 10 * dip - 35 * k; gam += 12 * dip - 45 * k; lz += 0.05 * dip; lx += 0.05 * k - 0.02 * dip; rH += 0.08 * k; rY -= 30 * k; rk = k; rT = 'u'; }
      if (move === 'leaduppercut') { dip = env(0.06, 0.2, 0.22, 0.34); k = env(0.22, 0.36, 0.44, 0.66); py += -0.09 * dip + 0.02 * k; beta += -10 * dip + 25 * k; gam += -12 * dip + 30 * k; lz -= 0.04 * dip; lx += 0.04 * k; lH += 0.04 * k; lk = k; lT = 'u'; }
      if (move === 'slip') { k = env(0.2, 0.34, 0.5, 0.72); py -= 0.07 * k; lz += 0.14 * k; lx += 0.04 * k; beta -= 15 * k; gam -= 20 * k; }
      if (move === 'leadslip') { k = env(0.2, 0.34, 0.5, 0.72); py -= 0.07 * k; lz -= 0.14 * k; lx += 0.04 * k; beta += 15 * k; gam += 20 * k; }
      if (move === 'roll' || move === 'leadroll') {
        var sg = move === 'leadroll' ? 1 : -1;
        var w = env(0.12, 0.2, 0.7, 0.8); var s = sm((t - 0.2) / 0.5);
        var drop = (t > 0.2 && t < 0.7) ? Math.sin(Math.PI * (t - 0.2) / 0.5) : 0;
        py -= 0.18 * drop; lx += 0.08 * drop; lz += sg * w * 0.12 * (1 - 2 * s); beta += sg * w * 15 * (1 - 2 * s); gam += sg * w * 18 * (1 - 2 * s);
      }
      if (move === 'step') {
        cx = 0.25;
        var oL = 0.2 * env(0.1, 0.24, 0.6, 0.74), oR = 0.2 * env(0.18, 0.32, 0.52, 0.66);
        var uL = bump(0.1, 0.24) + bump(0.6, 0.74), uR = bump(0.18, 0.32) + bump(0.52, 0.66);
        bL = add(bL, [oL, 0.035 * uL, 0]); bR = add(bR, [oR, 0.035 * uR, 0]);
        px += (oL + oR) / 2; lH += 0.04 * uL; rH += 0.04 * uR;
      }
      hipC = [px, py, 0.04];
      var hl = rotY([0, 0, -0.12], beta); Lh = add(hipC, hl); Rh = sub(hipC, hl);
      chest = add(hipC, [lx, 0.5, lz]);
      var sl = rotY([0, 0, -0.19], gam); Ls = add(chest, sl); Rs = sub(chest, sl);
      neck = add(chest, [lx * 0.3 + 0.02, 0.08, lz * 0.3]);
      head = add(chest, [lx * 0.5 + 0.04, 0.21, lz * 0.5]);
      var fb = rotY([1, 0, 0], gam), lb = rotY([0, 0, -1], gam);
      var fh = nrm(add(fb, [1.2, 0, 0]));
      var gL = add(add(head, mul(fh, 0.17)), add(mul(lb, 0.06), [0, -0.05, 0]));
      var gR = add(add(head, mul(fh, 0.12)), add(mul(lb, -0.1), [0, -0.09, 0]));
      var tl, pl, tr, pr;
      if (lT === 'h') { tl = bez(gL, add(Ls, add(mul(lb, 0.28), [0.12, 0.02, 0])), [0.62, 1.48, 0.06], lk); pl = lerp([0, -1, -0.5], add(lb, [0, 0.9, 0]), lk); }
      else if (lT === 'u') { tl = bez(gL, [0.25, 1.02, -0.14], [0.55, 1.5, -0.02], lk); pl = lerp([0, -1, -0.5], [-0.4, -1, -0.3], lk); }
      else { tl = lerp(gL, [0.98, 1.5, -0.02], lk); pl = [0, -1, -0.5]; }
      if (rT === 'h') { tr = bez(gR, add(Rs, add(mul(lb, -0.28), [0.12, 0.02, 0])), [0.62, 1.48, -0.06], rk); pr = lerp([0, -1, 0.5], add(mul(lb, -1), [0, 0.9, 0]), rk); }
      else if (rT === 'u') { tr = bez(gR, [0.2, 1.02, 0.16], [0.55, 1.5, 0.02], rk); pr = lerp([0, -1, 0.5], [-0.4, -1, 0.3], rk); }
      else { tr = lerp(gR, [0.98, 1.5, 0.02], rk); pr = [0, -1, 0.5]; }
      var al = ik(Ls, tl, 0.3, 0.29, pl), arr = ik(Rs, tr, 0.3, 0.29, pr);
      eL = al[0]; gl = al[1]; eR = arr[0]; gr = arr[1];
      var fdL = rotY([1, 0, 0], lY), fdR = rotY([1, 0, 0], rY);
      heelL = add(sub(bL, mul(fdL, 0.17)), [0, lH * 1.5, 0]); toeL = add(bL, mul(fdL, 0.05));
      heelR = add(sub(bR, mul(fdR, 0.17)), [0, rH * 1.5, 0]); toeR = add(bR, mul(fdR, 0.05));
      aL = add(add(heelL, mul(fdL, 0.03)), [0, 0.07, 0]);
      aR = add(add(heelR, mul(fdR, 0.03)), [0, 0.07, 0]);
      kL = ik(Lh, aL, 0.46, 0.46, add(fdL, [0, 0.1, 0]))[0];
      kR = ik(Rh, aR, 0.46, 0.46, add(fdR, [0, 0.1, 0]))[0];
      shadowX = px;
    }
    seg(Lh, kL, 12, FAR); seg(Lh, lerp(Lh, kL, 0.4), 15, TRUNK); seg(kL, aL, 10, FAR); seg(heelL, toeL, 7, FAR);
    seg(Rh, kR, 12, NEAR); seg(Rh, lerp(Rh, kR, 0.4), 15, TRUNK); seg(kR, aR, 10, NEAR); seg(heelR, toeR, 7, NEAR);
    seg(Lh, Rh, 18, TRUNK); seg(hipC, chest, 24, BODY); seg(Ls, Rs, 14, BODY); seg(chest, neck, 9, NEAR);
    dotAt(head, 22, NEAR);
    seg(Ls, eL, 9, FAR); seg(eL, gl, 8, FAR); dotAt(gl, 16, GF);
    seg(Rs, eR, 9, NEAR); seg(eR, gr, 8, NEAR); dotAt(gr, 16, GN);

    var c = 20 * R, cc = Math.cos(c), ss = Math.sin(c);
    function depth(p) { return p[0] * ss + p[2] * cc; }
    function sx(p) { return (100 + ((p[0] * cc - p[2] * ss) - cx) * 90).toFixed(1); }
    function sy(p) { return (184 - p[1] * 90).toFixed(1); }
    shapes.forEach(function (sh, i) { sh.z = (depth(sh.p) + depth(sh.q)) / 2 + i * 0.0001; });
    shapes.sort(function (a, b) { return a.z - b.z; });
    return {
      lines: shapes.map(function (s2) { return [sx(s2.p), sy(s2.p), sx(s2.q), sy(s2.q), s2.w, s2.k]; }),
      shadowX: sx([shadowX, 0, 0]), shadowRx: move === 'pushup' ? 70 : 40
    };
  }

  function draw(f) {
    var p = pose(f.move, f.t);
    for (var i = 0; i < SLOTS; i++) {
      var el = f.lines[i], d = p.lines[i];
      if (d) {
        el.setAttribute('x1', d[0]); el.setAttribute('y1', d[1]); el.setAttribute('x2', d[2]); el.setAttribute('y2', d[3]);
        el.setAttribute('stroke-width', d[4]); el.setAttribute('stroke', d[5]);
      } else { el.setAttribute('stroke-width', 0); }
    }
    f.shadow.setAttribute('cx', p.shadowX); f.shadow.setAttribute('rx', p.shadowRx);
  }

  function loop(now) {
    var dt = now - last;
    if (dt >= 33) {
      last = now;
      live = live.filter(function (f) { return f.el.isConnected; });
      live.forEach(function (f) { f.t = (f.t + Math.min(dt, 200) / 1000 / (1.8 / f.speed)) % 1; draw(f); });
    }
    rafId = live.length ? requestAnimationFrame(loop) : null;
  }

  function mount(el, opts) {
    opts = opts || {};
    var size = opts.size || 200;
    el.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'figure-box';
    box.style.width = size + 'px'; box.style.height = size + 'px';
    box.style.borderRadius = Math.round(size * 0.12) + 'px';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    svg.setAttribute('role', 'img');
    var ground = document.createElementNS(NS, 'line');
    [['x1', 18], ['y1', 185], ['x2', 182], ['y2', 185], ['stroke', '#2C2A27'], ['stroke-width', 2], ['stroke-linecap', 'round']].forEach(function (a) { ground.setAttribute(a[0], a[1]); });
    svg.appendChild(ground);
    var shadow = document.createElementNS(NS, 'ellipse');
    shadow.setAttribute('cy', 185); shadow.setAttribute('ry', 5); shadow.setAttribute('fill', '#000'); shadow.setAttribute('fill-opacity', '0.35');
    svg.appendChild(shadow);
    var lines = [];
    for (var i = 0; i < SLOTS; i++) {
      var l = document.createElementNS(NS, 'line'); l.setAttribute('stroke-linecap', 'round'); svg.appendChild(l); lines.push(l);
    }
    box.appendChild(svg); el.appendChild(box);
    var f = { el: box, svg: svg, lines: lines, shadow: shadow, move: opts.move || 'guard', speed: opts.speed || 1, t: reduce ? 0.4 : 0 };
    function label() { var m = (window.APP_DATA && APP_DATA.MOVES[f.move]) || { name: f.move }; svg.setAttribute('aria-label', m.name + ' demonstration'); }
    label(); draw(f);
    if (!reduce) { live.push(f); if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); } }
    return {
      setMove: function (m) { if (m !== f.move) { f.move = m; f.t = 0; label(); draw(f); } },
      setSpeed: function (s) { f.speed = s || 1; },
      destroy: function () { live = live.filter(function (x) { return x !== f; }); el.innerHTML = ''; }
    };
  }

  return { mount: mount };
})();
