export function landingPage(existingDigestId?: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Chad Nauseam News - Daily AI News Digest</title>
  <link rel="stylesheet" href="/style.css">
  <style>
    .cnn-title { display: inline-flex; font-size: inherit; }
    .cnn-word { display: inline-flex; overflow: hidden; white-space: nowrap; }
    .cnn-word .cnn-rest {
      display: inline-block;
      max-width: 0;
      opacity: 0;
      transition: max-width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity 0.7s ease;
    }
    .cnn-title.expanded .cnn-rest {
      max-width: 12ch;
      opacity: 1;
    }
    .cnn-space {
      display: inline-block;
      width: 0;
      transition: width 0.7s ease;
    }
    .cnn-title.expanded .cnn-space {
      width: 0.3em;
    }
    .marquee-wrap {
      overflow: hidden;
      mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    }
    .marquee-track {
      display: flex;
      gap: 12px;
      width: max-content;
      animation: marquee 55s linear infinite;
    }
    .marquee-track:hover { animation-play-state: paused; }
    @keyframes marquee {
      to { transform: translateX(-50%); }
    }
    .marquee-pill {
      flex-shrink: 0;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="max-w-2xl mx-auto px-5 py-10">
    <div class="text-center pt-16 pb-10">
      <h1 class="text-3xl sm:text-4xl font-bold text-primary mb-3 tracking-tight"><span id="cnn-title" class="cnn-title"><span class="cnn-word"><span class="cnn-cap">C</span><span class="cnn-rest">had</span></span><span class="cnn-space"></span><span class="cnn-word"><span class="cnn-cap">N</span><span class="cnn-rest">auseam</span></span><span class="cnn-space"></span><span class="cnn-word"><span class="cnn-cap">N</span><span class="cnn-rest">ews</span></span></span></h1>
      <p class="text-xl text-muted-foreground mb-5">Claude sends you a daily email about your interests.</p>
      <div class="marquee-wrap mb-8 -mx-5">
        <div class="marquee-track">
          <span class="marquee-pill bg-card text-muted-foreground">WebGPU</span>
          <span class="marquee-pill bg-card text-muted-foreground">Korean language learning</span>
          <span class="marquee-pill bg-card text-muted-foreground">sourdough bread</span>
          <span class="marquee-pill bg-card text-muted-foreground">monetary policy</span>
          <span class="marquee-pill bg-card text-muted-foreground">Supreme Court cases</span>
          <span class="marquee-pill bg-card text-muted-foreground">urban foraging</span>
          <span class="marquee-pill bg-card text-muted-foreground">CRISPR research</span>
          <span class="marquee-pill bg-card text-muted-foreground">amateur radio</span>
          <span class="marquee-pill bg-card text-muted-foreground">competitive chess</span>
          <span class="marquee-pill bg-card text-muted-foreground">type design</span>
          <span class="marquee-pill bg-card text-muted-foreground">Rust async runtime</span>
          <span class="marquee-pill bg-card text-muted-foreground">indie game dev</span>
          <span class="marquee-pill bg-card text-muted-foreground">fermentation</span>
          <span class="marquee-pill bg-card text-muted-foreground">transit urbanism</span>
          <span class="marquee-pill bg-card text-muted-foreground">mechanical keyboards</span>
          <span class="marquee-pill bg-card text-muted-foreground">WebGPU</span>
          <span class="marquee-pill bg-card text-muted-foreground">Korean language learning</span>
          <span class="marquee-pill bg-card text-muted-foreground">sourdough bread</span>
          <span class="marquee-pill bg-card text-muted-foreground">monetary policy</span>
          <span class="marquee-pill bg-card text-muted-foreground">Supreme Court cases</span>
          <span class="marquee-pill bg-card text-muted-foreground">urban foraging</span>
          <span class="marquee-pill bg-card text-muted-foreground">CRISPR research</span>
          <span class="marquee-pill bg-card text-muted-foreground">amateur radio</span>
          <span class="marquee-pill bg-card text-muted-foreground">competitive chess</span>
          <span class="marquee-pill bg-card text-muted-foreground">type design</span>
          <span class="marquee-pill bg-card text-muted-foreground">Rust async runtime</span>
          <span class="marquee-pill bg-card text-muted-foreground">indie game dev</span>
          <span class="marquee-pill bg-card text-muted-foreground">fermentation</span>
          <span class="marquee-pill bg-card text-muted-foreground">transit urbanism</span>
          <span class="marquee-pill bg-card text-muted-foreground">mechanical keyboards</span>
        </div>
      </div>
      <div class="flex flex-col items-center gap-3">
        ${existingDigestId ? `
        <a href="/d/${existingDigestId}" class="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-lg h-12 px-8 hover:opacity-85 transition-opacity no-underline">Go to My Digest</a>
        <button id="new-digest-toggle" class="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">or create a new digest</button>
        <div id="email-step" class="flex flex-col gap-2 w-full max-w-sm" style="display:none;">
        ` : `
        <div id="email-step" class="flex flex-col gap-2 w-full max-w-sm">
        `}
          <input id="email-input" type="email" placeholder="you@example.com" class="h-12 px-4 rounded-lg border border-border bg-card text-foreground text-base outline-none focus:ring-2 focus:ring-primary/40" />
          <div class="flex gap-2 w-full">
            <input id="topic-input" type="text" placeholder="Add a topic, e.g. quantum computing" class="flex-1 h-12 px-4 rounded-lg border border-border bg-card text-foreground text-base outline-none focus:ring-2 focus:ring-primary/40" />
            <button id="add-topic-btn" type="button" class="h-12 px-4 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-accent transition-colors cursor-pointer">Add</button>
          </div>
          <div id="topic-list" class="flex flex-wrap gap-2 empty:hidden"></div>
          <button id="create-btn" disabled class="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold h-12 px-6 hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">Keep me updated</button>
        </div>
      </div>
      <a href="https://github.com/anchpop/tellytax" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 no-underline">
        <svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        Source on GitHub
      </a>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-5">
      <div class="bg-card rounded-xl p-6 text-center">
        <div class="text-3xl mb-3">&#x1F50D;</div>
        <h3 class="text-primary font-semibold mb-2">Accurate &amp; Cited</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Claude searches the web and cites its sources so you can verify everything.</p>
      </div>
      <div class="bg-card rounded-xl p-6 text-center">
        <div class="text-3xl mb-3">&#x1F4E7;</div>
        <h3 class="text-primary font-semibold mb-2">Daily Email</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">A clean, structured digest lands in your inbox every morning at 8am.</p>
      </div>
      <div class="bg-card rounded-xl p-6 text-center">
        <div class="text-3xl mb-3">&#x1F9E0;</div>
        <h3 class="text-primary font-semibold mb-2">Context-Aware</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Tracks developing stories and avoids repetition by remembering past digests.</p>
      </div>
    </div>
  </div>
  <script>
    setTimeout(() => document.getElementById('cnn-title').classList.add('expanded'), 1400);
    const toggle = document.getElementById('new-digest-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.getElementById('email-step').style.display = '';
        toggle.style.display = 'none';
      });
    }
    const emailInput = document.getElementById('email-input');
    const topicInput = document.getElementById('topic-input');
    const addTopicBtn = document.getElementById('add-topic-btn');
    const topicList = document.getElementById('topic-list');
    const createBtn = document.getElementById('create-btn');
    const topics = [];
    function allTopics() {
      const typed = topicInput.value.trim();
      return typed ? [...topics, typed] : [...topics];
    }
    function updateBtn() {
      const all = allTopics();
      const hasEmail = emailInput.value.trim().length > 0;
      if (all.length === 0) {
        createBtn.textContent = 'Keep me updated';
        createBtn.disabled = true;
      } else {
        const extra = all.length - 1;
        createBtn.textContent = 'Keep me updated on ' + all[0] + (extra > 0 ? ' +' + extra : '');
        createBtn.disabled = !hasEmail;
      }
    }
    function addTopic() {
      const t = topicInput.value.trim();
      if (!t || topics.includes(t)) return;
      topics.push(t);
      topicInput.value = '';
      const pill = document.createElement('span');
      pill.className = 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-card border border-border text-sm text-foreground';
      pill.textContent = t;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'ml-1 text-muted-foreground hover:text-foreground cursor-pointer';
      removeBtn.textContent = '\u00d7';
      pill.appendChild(removeBtn);
      removeBtn.addEventListener('click', () => {
        topics.splice(topics.indexOf(t), 1);
        pill.remove();
        updateBtn();
      });
      topicList.appendChild(pill);
      updateBtn();
      topicInput.focus();
    }
    addTopicBtn.addEventListener('click', addTopic);
    topicInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } });
    topicInput.addEventListener('input', updateBtn);
    emailInput.addEventListener('input', updateBtn);
    emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); topicInput.focus(); } });
    async function createDigest() {
      // Commit any typed text as a topic before submitting
      const typed = topicInput.value.trim();
      if (typed && !topics.includes(typed)) { topics.push(typed); topicInput.value = ''; }
      const email = emailInput.value.trim();
      if (!email || !emailInput.reportValidity()) return;
      if (topics.length === 0) { topicInput.focus(); return; }
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
      try {
        const res = await fetch('/api/create', { method: 'POST' });
        const { id } = await res.json();
        const params = new URLSearchParams();
        params.set('email', email);
        topics.forEach(t => params.append('topic', t));
        window.location.href = '/d/' + id + '?' + params.toString();
      } catch (e) {
        createBtn.disabled = false;
        updateBtn();
        alert('Failed to create digest. Please try again.');
      }
    }
    createBtn.addEventListener('click', createDigest);
  </script>
</body>
</html>`;
}
