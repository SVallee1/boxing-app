/* Voice coach using the device's built-in text-to-speech. Picks the most natural English voice available. */
window.Coach = (function () {
  var synth = window.speechSynthesis || null;
  var voices = [];
  var listeners = [];

  function score(v) {
    var n = v.name || '', sc = 0;
    if (/natural|neural|online|premium|enhanced|siri/i.test(n)) sc += 6;
    if (/google/i.test(n)) sc += 3;
    if (/en[-_]GB/i.test(v.lang)) sc += 2;
    else if (/en[-_](IE|AU|US|CA)/i.test(v.lang)) sc += 1;
    if (/compact|espeak|robot|novelty|whisper|bad news|bells|zarvox|trinoids|albert|cellos|organ|bubbles|boing/i.test(n)) sc -= 10;
    return sc;
  }
  function load() {
    if (!synth) return;
    voices = (synth.getVoices() || []).filter(function (v) { return /^en/i.test(v.lang); });
    voices.sort(function (a, b) { return score(b) - score(a); });
    listeners.forEach(function (fn) { fn(voices); });
  }
  if (synth) { load(); try { synth.addEventListener('voiceschanged', load); } catch (e) { synth.onvoiceschanged = load; } }

  function settings() { return Store.get().settings; }

  function speak(text, force) {
    var st = settings();
    if (!synth || (!st.voice && !force)) return;
    synth.cancel();
    var chosen = voices.filter(function (v) { return v.name === st.voiceName; })[0] || voices[0];
    String(text).split(/(?<=[.!?])\s+/).filter(function (p) { return p.trim(); }).forEach(function (p) {
      var u = new SpeechSynthesisUtterance(p);
      if (chosen) { u.voice = chosen; u.lang = chosen.lang; } else { u.lang = 'en-GB'; }
      u.rate = 0.98; u.pitch = 1; u.volume = 1;
      synth.speak(u);
    });
  }
  function hush() { if (synth) synth.cancel(); }
  function sayCombo(combo) { return combo.map(function (m) { return APP_DATA.MOVES[m].name; }).join(', '); }

  return {
    supported: !!synth,
    speak: speak,
    hush: hush,
    sayCombo: sayCombo,
    voices: function () { return voices.slice(0, 15); },
    onVoices: function (fn) { listeners.push(fn); }
  };
})();
