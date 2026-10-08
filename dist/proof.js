const host = document.querySelector('#dependency-demo');

if (host) {
  const examples = {
    if: {
      address: 'B1', formula: '=IF(A1,B1,42)', outputs: ['B1', 'C1'],
      values: { A1: 0, B1: 42, C1: 43 },
      captions: [
        ['Same formula.', 'A1 is 0. B1 contains an IF formula, and C1 uses its result.'],
        ['A possible reference points back to B1.', 'The true branch refers to the cell that contains the formula.'],
        ['The condition is false. The formula returns 42.', 'The B1 reference belongs to the unused branch. C1 can then return 43.'],
        ['Same formula. Different dependency handling.', 'Evaltra follows the active branch. The unused reference does not block the result.']
      ],
      nodes: [['A1', '0', 'Condition'], ['B1', 'IF', 'Selected cell'], ['C1', 'B1 + 1', 'Dependent cell']],
      foot: 'Dashed line: a possible reference. Solid line: the active path.'
    },
    sumif: {
      address: 'A4', formula: '=SUMIF(B4:B5,1,C4:C5)', outputs: ['A4', 'C5'],
      values: { B4: 1, B5: 0, C4: 7, C5: 7, A4: 7 },
      captions: [
        ['Same formula.', 'SUMIF checks B4:B5 for 1 and adds the matching amounts from C4:C5.'],
        ['A possible reference points back to A4.', 'C5 refers to the total. Its row has a criterion of 0.'],
        ['Only the matching row contributes 7.', 'B4 matches 1, so C4 contributes 7. The C5 value is not needed for the sum.'],
        ['Same formula. Different dependency handling.', 'Evaltra returns 7. Both full ranges remain watched for future edits.']
      ],
      nodes: [['B4:B5', '1 · 0', 'Criteria range'], ['A4', 'SUMIF', 'Selected cell'], ['C4:C5', '7 · =A4', 'Amount range']],
      foot: 'Watched ranges stay B4:B5 and C4:C5, including the excluded row.'
    }
  };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icons = {
    play: '<path d="m8 5 10 7-10 7z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    replay: '<path d="M4 10a8 8 0 1 1 1.8 7M4 4v6h6"/>',
    previous: '<path d="m14 6-6 6 6 6"/>', next: '<path d="m10 6 6 6-6 6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  const formula = key => key === 'if'
    ? '=<span>IF</span>(<span data-token="condition">A1</span>,<span data-token="reference">B1</span>,<span data-token="value">42</span>)'
    : '=<span>SUMIF</span>(<span data-token="condition">B4:B5</span>,<span data-token="criterion">1</span>,<span data-token="value">C4:C5</span>)';
  const sheets = {
    if: '<tr><th scope="row">1</th><td data-cell="A1">0</td><td data-cell="B1" class="dep-selected">=IF(A1,B1,42)</td><td data-cell="C1">=B1+1</td></tr><tr aria-hidden="true"><th>2</th><td></td><td></td><td></td></tr><tr aria-hidden="true"><th>3</th><td></td><td></td><td></td></tr>',
    sumif: '<tr><th scope="row">4</th><td data-cell="A4" class="dep-selected" title="=SUMIF(B4:B5,1,C4:C5)">=SUMIF(…)</td><td data-cell="B4" class="dep-watch dep-watch-top">1</td><td data-cell="C4" class="dep-watch dep-watch-top">7</td></tr><tr><th scope="row">5</th><td></td><td data-cell="B5" class="dep-watch dep-watch-bottom">0</td><td data-cell="C5" class="dep-watch dep-watch-bottom">=A4</td></tr><tr aria-hidden="true"><th>6</th><td></td><td></td><td></td></tr>'
  };
  const scene = key => {
    const example = examples[key];
    return `<div class="dep-example" data-example-panel="${key}"${key === 'sumif' ? ' hidden' : ''}>
      <div class="dep-formula-bar"><span class="dep-address">${example.address}</span><span class="dep-fx" aria-hidden="true">fx</span><code aria-label="${escape(example.formula)}">${formula(key)}</code></div>
      <div class="dep-main">
        <div class="dep-sheet-wrap"><div class="dep-panel-label">Worksheet <span>${key === 'if' ? 'Sheet1' : 'Sheet2'}</span></div>
          <table class="dep-sheet" aria-label="${key.toUpperCase()} formula example"><colgroup><col class="dep-row-index"><col class="dep-col-a"><col class="dep-col-b"><col class="dep-col-c"></colgroup><thead><tr><th aria-label="Row"></th><th scope="col">A</th><th scope="col">B</th><th scope="col">C</th></tr></thead><tbody>${sheets[key]}</tbody></table>
          <p class="dep-sheet-note">${key === 'if' ? '<span class="dep-key-square"></span> B1 is the selected formula cell.' : '<span class="dep-key-range"></span> Full ranges watched: B4:B5 and C4:C5.'}</p>
        </div>
        <div class="dep-path-wrap"><div class="dep-panel-label">Dependency path <span>Evaltra</span></div>
          <div class="dep-graph" aria-label="${key === 'if' ? 'A1 condition, B1 formula and C1 dependent cell. B1 also has a possible self-reference.' : 'Both full ranges B4:B5 and C4:C5 are watched by A4. C5 has a possible reference back to A4.'}">
            <div class="dep-loop" aria-hidden="true"><svg viewBox="0 0 220 40" preserveAspectRatio="none"><path d="M82 37V14Q82 7 89 7H${key === 'if' ? '131Q138 7 138 14V33M134 28L138 33L142 28' : '200Q208 7 208 14V33M204 28L208 33L212 28'}"/></svg><span>${key === 'if' ? 'B1 → B1' : 'A4 → C5'}</span></div>
            <div class="dep-graph-nodes">${example.nodes.map(([address, value, label], i) => `<div class="dep-node${key === 'sumif' && i !== 1 ? ' dep-range-node' : ''}" data-node="${i}"><span class="dep-node-address">${address}</span><strong data-node-value="${i}">${value}</strong><span class="dep-node-label">${label}</span></div>`).join('')}</div>
            <span class="dep-edge dep-edge-first" aria-hidden="true"></span><span class="dep-edge dep-edge-second" aria-hidden="true"></span><span class="dep-focus-marker" aria-hidden="true"></span>
          </div><p class="dep-path-note">${example.foot}</p>
        </div>
      </div>
    </div>`;
  };
  host.innerHTML = `<div class="dep-workbook" aria-label="Formula dependency walkthrough">
    <div class="dep-toolbar"><span class="dep-workbook-name"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg> Inside the formula</span><div class="dep-examples" role="group" aria-label="Choose formula example"><button type="button" data-example="if" aria-pressed="true">IF</button><button type="button" data-example="sumif" aria-pressed="false">SUMIF</button></div></div>
    ${scene('if')}${scene('sumif')}
    <div class="dep-caption"><span class="dep-step-number" aria-hidden="true">01</span><div><h3 data-caption-title>Same formula.</h3><p data-caption-detail>A1 is 0. B1 contains an IF formula, and C1 uses its result.</p></div></div>
    <div class="dep-comparison" aria-label="Result comparison" aria-busy="true">
      ${[['evaltra', 'Evaltra', 'Runtime dependencies'], ['excel', 'Excel', ''], ['other', 'Other Engines', 'Static dependencies']].map(([engine, name, sub]) => `<div class="dep-result-card dep-result-${engine}"><h4>${name}</h4><p class="dep-result-kind">${sub || '&nbsp;'}</p><dl>${[0, 1].map(i => `<div><dt data-result-address="${i}"></dt><dd data-result-engine="${engine}" data-result-index="${i}">—</dd></div>`).join('')}</dl></div>`).join('')}
    </div>
    <div class="dep-footer"><div class="dep-playback"><button type="button" class="dep-play" data-action="play" disabled>${icon('play')}<span>Play</span></button><button type="button" class="dep-replay" data-action="replay" disabled>${icon('replay')}<span>Replay</span></button></div><div class="dep-steps"><button type="button" data-action="previous" aria-label="Previous step" title="Previous step" disabled>${icon('previous')}</button><span class="dep-step-text">Step 1 of 4</span><button type="button" data-action="next" aria-label="Next step" title="Next step" disabled>${icon('next')}</button></div></div>
    <div class="dep-load-state" role="status"><p data-load-message>Loading example…</p><button type="button" data-action="retry" hidden>Retry</button></div>
    <p class="dep-sr-only" data-announcement role="status" aria-live="polite" aria-atomic="true"></p>
  </div>`;

  const $ = selector => host.querySelector(selector);
  const $$ = selector => [...host.querySelectorAll(selector)];
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { example: 'if', step: media.matches ? 3 : 0, cue: 1, playing: false, remainingHoldMs: 1200, generation: 0, ready: false, reduced: media.matches, hasInteracted: false, autoplayUsed: media.matches, visible: false };
  let reference, timer, deadline = 0, requestGeneration = 0, requestController;
  const animations = new Set();
  const holds = [1200, 1600, 1800, 0];
  const duration = 200;
  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const easeInOut = 'cubic-bezier(0.77, 0, 0.175, 1)';

  function activePanel() { return $(`[data-example-panel="${state.example}"]`); }
  function clearTimer() { window.clearTimeout(timer); timer = undefined; }
  function cancelMotion() { animations.forEach(animation => animation.cancel()); animations.clear(); }
  function invalidate() { state.generation += 1; clearTimer(); cancelMotion(); }
  function animate(element, keyframes, easing = easeOut) {
    if (state.reduced || !element.animate) return;
    const animation = element.animate(keyframes, { duration, easing });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }
  function announce() {
    const example = examples[state.example];
    const ending = state.step === 3 && state.ready ? ` ${example.outputs.map(address => `${address}: Evaltra ${example.values[address]}, Excel ${reference.cases[state.example].cells[address].excel}, Other Engines ${reference.cases[state.example].cells[address].other}.`).join(' ')}` : '';
    $('[data-announcement]').textContent = `${state.example.toUpperCase()}, step ${state.step + 1} of 4. ${example.captions[state.step].join(' ')}${ending}`;
  }
  function updateControls() {
    $('[data-action="play"] span').textContent = state.playing ? 'Pause' : 'Play';
    $('[data-action="play"] svg').innerHTML = icons[state.playing ? 'pause' : 'play'];
    $('[data-action="play"]').setAttribute('aria-label', state.playing ? 'Pause animation' : 'Play animation');
    $('[data-action="play"]').disabled = !state.ready;
    $('[data-action="replay"]').disabled = !state.ready;
    // Keep edge-step buttons focusable so the final click never drops keyboard focus.
    $('[data-action="previous"]').disabled = !state.ready;
    $('[data-action="next"]').disabled = !state.ready;
    $('[data-action="previous"]').setAttribute('aria-disabled', String(!state.ready || state.step === 0));
    $('[data-action="next"]').setAttribute('aria-disabled', String(!state.ready || state.step === 3));
    $('.dep-step-text').textContent = `Step ${state.step + 1} of 4`;
    host.dataset.example = state.example;
    host.dataset.step = String(state.step);
    host.dataset.playing = String(state.playing);
    host.dataset.ready = String(state.ready);
  }
  function positionMarker(motion) {
    const panel = activePanel();
    const marker = panel.querySelector('.dep-focus-marker');
    const nodeIndex = state.step === 2 && state.cue === 0 ? 0 : state.step === 2 && state.example === 'sumif' ? 2 : 1;
    const graphRect = panel.querySelector('.dep-graph').getBoundingClientRect();
    // Read once per state/resize, never per animation frame. The real node bounds
    // anchor the possible loop and data-flow arrows at every responsive width.
    const nodeRects = [...panel.querySelectorAll('[data-node]')].map(node => node.getBoundingClientRect());
    const nodeRect = nodeRects[nodeIndex];
    const middle = nodeRects[1];
    const far = state.example === 'if' ? middle : nodeRects[2];
    const loopY = middle.top - graphRect.top;
    const startX = middle.left - graphRect.left + middle.width * (state.example === 'if' ? 0.08 : 0.55);
    const endX = far.left - graphRect.left + far.width * (state.example === 'if' ? 0.92 : 0.55);
    const loop = panel.querySelector('.dep-loop');
    loop.style.height = `${loopY + 1}px`;
    loop.querySelector('svg').setAttribute('viewBox', `0 0 ${graphRect.width} ${loopY + 1}`);
    loop.querySelector('path').setAttribute('d', `M${startX} ${loopY}V14Q${startX} 7 ${startX + 7} 7H${endX - 7}Q${endX} 7 ${endX} 14V${loopY}M${endX - 3} ${loopY - 5}L${endX} ${loopY}L${endX + 3} ${loopY - 5}`);
    loop.querySelector('span').style.left = `${(startX + endX) / 2}px`;
    panel.querySelectorAll('.dep-edge').forEach((edge, index) => {
      const from = nodeRects[index];
      const to = nodeRects[index + 1];
      edge.style.left = `${from.right - graphRect.left}px`;
      edge.style.right = 'auto';
      edge.style.width = `${Math.max(0, to.left - from.right - 3)}px`;
      edge.style.top = `${from.top - graphRect.top + from.height / 2}px`;
    });
    const nextTransform = `translate(${nodeRect.left - graphRect.left + nodeRect.width / 2 - 4}px, ${nodeRect.top - graphRect.top - 5}px)`;
    const previousTransform = marker.style.transform || nextTransform;
    marker.style.transform = nextTransform;
    panel.querySelectorAll('[data-node]').forEach(node => node.classList.toggle('is-focused', Number(node.dataset.node) === nodeIndex && state.step !== 3));
    if (motion && state.step !== 3) animate(marker, [{ transform: previousTransform, opacity: 0.7 }, { transform: nextTransform, opacity: 1 }], easeInOut);
  }
  function render({ motion = false, manual = false } = {}) {
    const example = examples[state.example];
    $$('[data-example-panel]').forEach(panel => { panel.hidden = panel.dataset.examplePanel !== state.example; });
    $$('[data-example]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.example === state.example)));
    const panel = activePanel();
    panel.dataset.stage = String(state.step);
    panel.dataset.cue = String(state.cue);
    const caption = example.captions[state.step];
    $('[data-caption-title]').textContent = state.step === 2 && state.cue === 0 && state.example === 'if' ? 'A1 is 0. The condition is false.' : caption[0];
    $('[data-caption-detail]').textContent = caption[1];
    $('.dep-step-number').textContent = String(state.step + 1).padStart(2, '0');
    const tokenName = state.step === 1 ? 'reference' : state.step === 2 ? (state.cue === 0 ? 'condition' : 'value') : '';
    panel.querySelectorAll('[data-token]').forEach(token => token.classList.toggle('is-focused', token.dataset.token === tokenName));
    panel.querySelector('[data-node-value="1"]').textContent = state.ready && state.step >= 2 && state.cue === 1 ? String(example.values[example.address]) : example.nodes[1][1];
    panel.querySelector('[data-node-value="2"]').textContent = state.ready && state.example === 'if' && state.step === 3 ? '43' : state.ready && state.example === 'sumif' && state.step >= 2 ? 'C4 = 7' : example.nodes[2][1];
    const reveal = state.step === 3 && state.ready;
    $('.dep-comparison').classList.toggle('is-revealed', reveal);
    $$('.dep-result-card dd').forEach(value => {
      const address = example.outputs[Number(value.dataset.resultIndex)];
      const engine = value.dataset.resultEngine;
      const result = reveal ? engine === 'evaltra' ? example.values[address] : reference.cases[state.example].cells[address][engine] : '—';
      value.textContent = String(result);
      value.classList.toggle('dep-cycle', typeof result === 'string' && result.startsWith('#'));
    });
    $$('[data-result-address]').forEach(label => { label.textContent = example.outputs[Number(label.dataset.resultAddress)]; });
    positionMarker(motion);
    if (motion && reveal) animate($('.dep-comparison'), [{ opacity: 0.25 }, { opacity: 1 }]);
    updateControls();
    if (manual || reveal) announce();
  }
  function armTimer() {
    clearTimer();
    if (!state.playing || state.step === 3) return;
    const generation = state.generation;
    deadline = performance.now() + state.remainingHoldMs;
    timer = window.setTimeout(() => {
      if (generation !== state.generation || !state.playing) return;
      cancelMotion();
      if (state.step === 2 && state.cue === 0) {
        state.cue = 1; state.remainingHoldMs = 1200;
      } else {
        state.step += 1; state.cue = state.step === 2 ? 0 : 1;
        state.remainingHoldMs = state.step === 2 ? 600 : holds[state.step];
      }
      if (state.step === 3) state.playing = false;
      render({ motion: true });
      armTimer();
    }, state.remainingHoldMs);
  }
  function pause() {
    if (!state.playing) return;
    state.remainingHoldMs = Math.max(0, deadline - performance.now());
    state.playing = false;
    clearTimer();
    animations.forEach(animation => animation.pause());
    updateControls();
  }
  function play() {
    if (!state.ready || document.hidden) return;
    if (state.step === 3) {
      invalidate(); state.step = 0; state.cue = 1; state.remainingHoldMs = holds[0]; render();
    }
    state.playing = true;
    animations.forEach(animation => { if (animation.playState === 'paused') animation.play(); });
    updateControls(); armTimer();
  }
  function goToStep(step) {
    invalidate();
    state.playing = false; state.step = step; state.cue = 1; state.remainingHoldMs = holds[step];
    render({ manual: true });
  }
  function maybeAutoplay() {
    if (state.ready && state.visible && !state.reduced && !state.autoplayUsed && !state.hasInteracted && !document.hidden) {
      state.autoplayUsed = true; play();
    }
  }
  host.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !host.contains(button) || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    state.hasInteracted = true; state.autoplayUsed = true;
    if (button.dataset.example) {
      state.example = button.dataset.example; goToStep(state.reduced ? 3 : 0); return;
    }
    switch (button.dataset.action) {
      case 'play': state.playing ? pause() : play(); break;
      case 'replay': goToStep(0); if (!state.reduced) play(); break;
      case 'previous': goToStep(Math.max(0, state.step - 1)); break;
      case 'next': goToStep(Math.min(3, state.step + 1)); break;
      case 'retry': loadReference(); break;
    }
  });

  async function loadReference() {
    const request = ++requestGeneration;
    requestController?.abort();
    requestController = new AbortController();
    const controller = requestController;
    const timeout = window.setTimeout(() => controller.abort(), 22000);
    state.ready = false; invalidate(); state.playing = false;
    $('.dep-load-state').hidden = false;
    $('[data-load-message]').textContent = 'Loading example…';
    $('[data-action="retry"]').hidden = true;
    $('.dep-comparison').setAttribute('aria-busy', 'true');
    render();
    try {
      const response = await fetch(new URL('./grid-reference.json', import.meta.url), { signal: controller.signal });
      if (!response.ok) throw new Error('Example data unavailable.');
      const data = await response.json();
      for (const [key, example] of Object.entries(examples)) {
        for (const [address, expected] of Object.entries(example.values)) {
          const cell = data?.cases?.[key]?.cells?.[address];
          const otherExpected = example.outputs.includes(address) ? '#CYCLE!' : expected;
          if (!cell || cell.excel !== expected || cell.other !== otherExpected) throw new Error('Example data could not be verified.');
        }
      }
      if (request !== requestGeneration) return;
      reference = data; state.ready = true;
      $('.dep-load-state').hidden = true;
      render(); maybeAutoplay();
    } catch (error) {
      if (request !== requestGeneration) return;
      state.ready = false;
      $('[data-load-message]').textContent = error.name === 'AbortError' ? 'Example data took too long to load. Please retry.' : 'Example data could not be loaded. Please retry.';
      $('[data-action="retry"]').hidden = false;
      render();
    } finally {
      window.clearTimeout(timeout);
      if (request === requestGeneration) $('.dep-comparison').setAttribute('aria-busy', 'false');
    }
  }

  // Observe the worksheet and path, rather than the tall mobile result/control region.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target !== activePanel().querySelector('.dep-main')) continue;
      state.visible = entry.intersectionRatio >= 0.5;
      if (!entry.isIntersecting) pause();
      maybeAutoplay();
    }
  }, { threshold: [0, 0.5] });
  $$('.dep-main').forEach(element => observer.observe(element));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  media.addEventListener('change', event => {
    state.reduced = event.matches;
    if (event.matches) { state.autoplayUsed = true; goToStep(3); }
  });
  let resizeFrame;
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { cancelMotion(); positionMarker(false); });
  });
  resizeObserver.observe(host);
  window.addEventListener('pagehide', () => { pause(); requestController?.abort(); });
  render(); loadReference();
}
