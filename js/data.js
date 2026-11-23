/* Boxing app – content: moves, combinations, plans and programmes. Edit freely. */
window.APP_DATA = (function () {
  var MOVES = {
    guard: { name: 'Guard', cat: 'Stance', cues: ['Feet shoulder-width, lead foot forward', 'Hands by the cheekbones, elbows tucked', 'Chin down, eyes up'], fault: 'letting the rear hand drift away from the chin.' },
    jab: { name: 'Jab', cat: 'Offence · lead hand', cues: ['Extend the lead hand straight from the chin', 'Turn the fist over at the end', 'Snap it back the same way it went out'], fault: 'dropping the hand on the way back.' },
    cross: { name: 'Straight', cat: 'Offence · rear hand', cues: ['Drive off the back foot and turn the hip', 'Rear hand travels in a straight line', 'Lead hand stays home to guard'], fault: 'leaning over the front foot.' },
    hook: { name: 'Lead hook', cat: 'Offence · lead hand', cues: ['Elbow up, arm bent at about 90°', 'Pivot the lead foot and turn the hip', 'Keep it compact, no wind-up'], fault: 'swinging wide and opening up your chin.' },
    rearhook: { name: 'Rear hook', cat: 'Offence · rear hand', cues: ['Turn hard off the back foot, heel up', 'Elbow at shoulder height, arm bent', 'Lead hand stays on the chin'], fault: 'looping it wide so it is easy to see coming.' },
    leaduppercut: { name: 'Lead uppercut', cat: 'Offence · lead hand', cues: ['Sit slightly onto the lead leg', 'Drive up and turn the lead hip in', 'Keep it short, under their guard'], fault: 'dropping the lead hand before you throw.' },
    uppercut: { name: 'Rear uppercut', cat: 'Offence · rear hand', cues: ['Dip slightly at the knees', 'Drive up through the legs and hips', 'Palm faces you at the top'], fault: 'dropping the hand low before you throw.' },
    slip: { name: 'Slip to rear', cat: 'Defence', cues: ['Bend at the knees and turn the shoulders', 'Move your head just off the line of the punch', 'Stay balanced, ready to counter'], fault: 'bending at the waist instead of the knees.' },
    leadslip: { name: 'Lead slip', cat: 'Defence', cues: ['Bend the knees and turn the lead shoulder in', 'Head moves to your lead side, off the straight', 'Load the lead hook or uppercut to counter'], fault: 'leaning too far and losing your base.' },
    roll: { name: 'Roll to rear', cat: 'Defence', cues: ['Drop under in a U shape towards your rear side', 'Keep your eyes on your opponent', 'Come up ready to counter with the lead hook'], fault: 'ducking forward with your head down.' },
    leadroll: { name: 'Lead roll', cat: 'Defence', cues: ['Drop under from your rear side to your lead side', 'Eyes on your opponent the whole way', 'Rise ready to throw the rear hand'], fault: 'rolling with straight legs and bending at the waist.' },
    step: { name: 'Step in and out', cat: 'Movement', cues: ['Lead foot moves first going forward', 'Back foot moves first going back', 'Never cross your feet'], fault: 'bouncing too high and losing balance.' },
    pushup: { name: 'Push-up', cat: 'Fitness', cues: ['Hands under the shoulders', 'Body in one straight line, core tight', 'Lower chest to just above the floor'], fault: 'letting the hips sag.' }
  };
  var MOVE_ORDER = ['jab', 'cross', 'hook', 'rearhook', 'leaduppercut', 'uppercut', 'slip', 'leadslip', 'roll', 'leadroll', 'step', 'guard', 'pushup'];

  /* Combination ladders. Each round uses one combo per minute, climbing a level each minute:
     minute 1 = level 1, minute 2 = level 2, minute 3 = level 3 (later weeks start one level higher).
     Each level has 4 options; sessions rotate through them. Edit or add your own. */
  var LADDERS = {
    Offence: [
      [['jab', 'cross'], ['jab', 'jab', 'cross'], ['jab', 'hook'], ['cross', 'hook']],
      [['jab', 'cross', 'hook'], ['jab', 'cross', 'uppercut'], ['jab', 'jab', 'cross', 'hook'], ['leaduppercut', 'cross', 'hook']],
      [['jab', 'cross', 'hook', 'cross'], ['jab', 'cross', 'uppercut', 'hook'], ['hook', 'rearhook', 'hook', 'cross'], ['jab', 'rearhook', 'hook', 'cross']],
      [['jab', 'cross', 'hook', 'uppercut', 'hook', 'cross'], ['jab', 'cross', 'leaduppercut', 'cross', 'hook'], ['jab', 'jab', 'cross', 'hook', 'uppercut', 'hook'], ['cross', 'hook', 'cross', 'rearhook', 'hook']]
    ],
    Defence: [
      [['slip', 'cross'], ['jab', 'slip'], ['roll', 'hook'], ['leadslip', 'hook']],
      [['slip', 'cross', 'hook'], ['jab', 'cross', 'slip', 'cross'], ['roll', 'hook', 'cross'], ['leadslip', 'leaduppercut', 'cross']],
      [['jab', 'cross', 'roll', 'hook', 'cross'], ['slip', 'cross', 'hook', 'leadroll'], ['jab', 'leadslip', 'leaduppercut', 'cross'], ['hook', 'roll', 'hook', 'cross']],
      [['jab', 'cross', 'leadroll', 'cross', 'hook', 'roll'], ['slip', 'uppercut', 'hook', 'roll', 'hook', 'cross'], ['jab', 'jab', 'cross', 'roll', 'hook', 'cross'], ['leadslip', 'hook', 'cross', 'roll', 'rearhook']]
    ],
    Movement: [
      [['jab', 'cross', 'step'], ['step', 'jab'], ['jab', 'step'], ['step', 'jab', 'cross']],
      [['slip', 'step', 'rearhook'], ['step', 'jab', 'cross', 'step'], ['leadslip', 'step', 'hook'], ['jab', 'cross', 'step', 'jab']],
      [['jab', 'step', 'jab', 'cross'], ['jab', 'step', 'jab', 'cross', 'hook'], ['slip', 'step', 'cross', 'hook'], ['step', 'jab', 'cross', 'roll', 'step']],
      [['step', 'jab', 'jab', 'cross', 'hook', 'step'], ['jab', 'cross', 'slip', 'step', 'cross', 'hook'], ['leadslip', 'step', 'hook', 'cross', 'roll', 'step'], ['jab', 'step', 'jab', 'cross', 'uppercut', 'hook']]
    ],
    Fitness: [
      [['jab', 'cross'], ['hook', 'rearhook'], ['uppercut', 'leaduppercut'], ['jab', 'jab']],
      [['jab', 'cross', 'jab', 'cross'], ['hook', 'rearhook', 'hook', 'rearhook'], ['uppercut', 'leaduppercut', 'uppercut', 'leaduppercut'], ['jab', 'cross', 'hook']],
      [['jab', 'cross', 'hook', 'cross'], ['jab', 'cross', 'uppercut', 'hook'], ['hook', 'rearhook', 'uppercut', 'leaduppercut'], ['jab', 'jab', 'cross', 'cross']],
      [['jab', 'cross', 'hook', 'cross', 'jab', 'cross'], ['hook', 'rearhook', 'hook', 'rearhook', 'uppercut', 'leaduppercut'], ['jab', 'jab', 'cross', 'hook', 'cross', 'hook'], ['uppercut', 'hook', 'uppercut', 'hook', 'cross', 'cross']]
    ]
  };

  var CONDITIONING = {
    light: ['Push-ups 3 × 10', 'Plank 3 × 30 s', 'Skipping 2 min'],
    standard: ['Push-ups 4 × 15', 'Burpees 3 × 10', 'Plank 3 × 45 s'],
    hard: ['Push-ups 5 × 20', 'Burpees 4 × 12', 'Squat jumps 3 × 15', 'Plank 3 × 60 s']
  };

  /* Each plan: weeks, phases and the sessions in each week: [title, focus tags, minutes]. */
  var PLANS = [
    {
      id: 'fundamentals', name: 'Boxing fundamentals', level: 'Beginner', tags: ['Offence', 'Defence', 'Movement'],
      desc: 'Stance, guard, jab, straight and basic footwork. Ends each session with a short bodyweight circuit.',
      weeks: 4, days: [0, 2, 4],
      phases: { 1: 'Foundations', 2: 'Foundations', 3: 'Build', 4: 'Test week' },
      sessions: function (w) { return [['Guard, jab and footwork · week ' + w, ['Offence', 'Movement'], 30 + w * 2], ['Block, parry, straight · week ' + w, ['Defence', 'Offence'], 30 + w * 2], ['Base fitness and bag · week ' + w, ['Fitness', 'Offence'], 30]]; }
    },
    {
      id: 'defence', name: 'Defence & counters', level: 'Intermediate', tags: ['Defence', 'Offence'],
      desc: 'Slips, rolls, parries and blocks, each paired with a counter: hooks, uppercuts and body shots.',
      weeks: 8, days: [0, 1, 3, 6],
      phases: { 1: 'Foundations', 2: 'Foundations', 3: 'Build', 4: 'Build', 5: 'Build', 6: 'Sharpen', 7: 'Sharpen', 8: 'Test week' },
      table: {
        1: [['Guard, jab and block', ['Defence', 'Offence'], 35], ['Base fitness circuit', ['Fitness'], 30], ['Footwork: in and out', ['Movement'], 30], ['Parry the jab, return jab, straight', ['Defence', 'Offence'], 35]],
        2: [['Jab, straight and slip', ['Defence', 'Offence'], 40], ['Skipping and push-up ladder', ['Fitness'], 30], ['Pivots and angles', ['Movement'], 35], ['Parry and counter rounds', ['Defence', 'Offence'], 40]],
        3: [['Slip and counter', ['Defence', 'Offence'], 40], ['Fight fitness circuit', ['Fitness'], 35], ['Footwork and angles', ['Movement'], 35], ['Defence & counters', ['Defence', 'Offence'], 45]],
        4: [['Roll under the hook', ['Defence', 'Offence'], 45], ['Bag power rounds', ['Offence', 'Fitness'], 40], ['Cutting off space', ['Movement'], 35], ['Slip, roll, counter combos', ['Defence', 'Offence'], 45]],
        5: [['Body shots and elbow blocks', ['Defence', 'Offence'], 45], ['Intervals: 6 × 400 m', ['Fitness'], 35], ['Lateral movement drills', ['Movement'], 35], ['Counter-punch bag rounds', ['Defence', 'Offence'], 50]],
        6: [['Combos off the slip', ['Defence', 'Offence'], 45], ['Fight fitness circuit+', ['Fitness'], 40], ['Feints and angles', ['Movement', 'Offence'], 40], ['Fight-rhythm shadow and bag', ['Offence', 'Defence'], 50]],
        7: [['Speed and reaction drills', ['Defence', 'Offence'], 45], ['Conditioning: 5 km tempo', ['Fitness'], 35], ['Ring movement rounds', ['Movement'], 40], ['Full-round defence drills', ['Defence'], 50]],
        8: [['Technique check: film it', ['Offence', 'Defence', 'Movement'], 40], ['Fitness test: push-ups in 1 min', ['Fitness'], 30], ['Movement test rounds', ['Movement'], 35], ['Final: 8 × 3 min mixed', ['Offence', 'Defence', 'Movement'], 50]]
      }
    },
    {
      id: 'power', name: 'Combinations & power', level: 'Intermediate', tags: ['Offence'],
      desc: 'Bag and shadow rounds building 3–6 punch combos with lead hooks and rear uppercuts.',
      weeks: 6, days: [0, 2, 5],
      phases: { 1: 'Foundations', 2: 'Build', 3: 'Build', 4: 'Sharpen', 5: 'Sharpen', 6: 'Test week' },
      sessions: function (w) { return [['Hooks and straights · week ' + w, ['Offence'], 40], ['Uppercut combinations · week ' + w, ['Offence'], 40], ['Power bag rounds · week ' + w, ['Offence', 'Fitness'], 45]]; }
    },
    {
      id: 'footwork', name: 'Footwork & movement', level: 'All levels', tags: ['Movement', 'Defence'],
      desc: 'Pivots, angles, cutting off space and in-and-out drills.',
      weeks: 4, days: [1, 3, 5],
      phases: { 1: 'Foundations', 2: 'Build', 3: 'Sharpen', 4: 'Test week' },
      sessions: function (w) { return [['In and out, pivots · week ' + w, ['Movement'], 30], ['Angles off the jab · week ' + w, ['Movement', 'Offence'], 35], ['Move and slip · week ' + w, ['Movement', 'Defence'], 35]]; }
    },
    {
      id: 'fitness', name: 'Fight fitness', level: 'All levels', tags: ['Fitness'],
      desc: 'Skipping, push-ups, core circuits and interval runs measured in km.',
      weeks: 6, days: [0, 1, 3, 5],
      phases: { 1: 'Foundations', 2: 'Build', 3: 'Build', 4: 'Sharpen', 5: 'Sharpen', 6: 'Test week' },
      sessions: function (w) { return [['Skipping and push-ups · week ' + w, ['Fitness'], 30], ['Bag intervals · week ' + w, ['Fitness', 'Offence'], 35], ['Core and conditioning · week ' + w, ['Fitness'], 30], ['Roadwork: ' + (3 + w) + ' km', ['Fitness'], 35]]; }
    }
  ];

  /* The warm-up round: one task per minute. */
  var WARMUP = [
    { moves: ['step'], text: 'Light footwork. Step in and out, stay on your toes' },
    { moves: ['jab', 'cross'], text: 'Shadow boxing. Easy jab and straight, guard up' },
    { moves: ['slip', 'roll'], text: 'Loosen up. Slips and rolls, nice and easy' }
  ];

  /* Trainer planner: exercise types and the activities offered in each dropdown.
     "measure" is what gets filled in by default: time (minutes), rounds, or sets and reps.
     "tags" decide which part of the Progress balance it counts towards. */
  var TRAINER = [
    { id: 'warmup', name: 'Warm-up', measure: 'time', tags: ['Fitness'], activities: ['Skipping', 'Running', 'Sprints', 'Light bag work', 'Shadow boxing', 'Dynamic stretches', 'Footwork ladder'] },
    { id: 'technique', name: 'Technique', measure: 'rounds', tags: ['Offence', 'Defence'], activities: ['Shadow boxing', 'Jab drills', 'Combination drills', 'Slip and roll drills', 'Parry and block drills', 'Mirror drills'] },
    { id: 'footwork', name: 'Footwork', measure: 'rounds', tags: ['Movement'], activities: ['In and out', 'Pivots and angles', 'Cutting off the ring', 'Ladder drills', 'Cone drills'] },
    { id: 'pads', name: 'Pad work', measure: 'rounds', tags: ['Offence', 'Defence'], activities: ['Pad rounds', 'Combination pads', 'Counter-punch pads', 'Defence on the pads', 'Body-shot pads'] },
    { id: 'bag', name: 'Bag work', measure: 'rounds', tags: ['Offence', 'Fitness'], activities: ['Heavy bag rounds', 'Power bag', 'Speed bag', 'Double-end bag', 'Body-shot bag', 'Bag intervals'] },
    { id: 'sparring', name: 'Sparring', measure: 'rounds', tags: ['Offence', 'Defence', 'Movement'], activities: ['Technical sparring', 'Conditioned sparring', 'Body sparring', 'Open sparring'] },
    { id: 'conditioning', name: 'Conditioning', measure: 'sets', tags: ['Fitness'], activities: ['Push-ups', 'Burpees', 'Squats', 'Squat jumps', 'Plank', 'Sit-ups', 'Medicine ball throws', 'Circuit', 'Interval runs'] },
    { id: 'cooldown', name: 'Warm-down', measure: 'time', tags: ['Fitness'], activities: ['Easy walk', 'Stretching', 'Foam rolling', 'Breathing'] }
  ];

  return { MOVES: MOVES, MOVE_ORDER: MOVE_ORDER, LADDERS: LADDERS, TRAINER: TRAINER, CONDITIONING: CONDITIONING, PLANS: PLANS, WARMUP: WARMUP };
})();
