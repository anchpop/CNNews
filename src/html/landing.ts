export function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>TellyTax - Daily AI News Digest</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="max-w-2xl mx-auto px-5 py-10">
    <div class="text-center pt-16 pb-10">
      <h1 class="text-5xl font-bold text-primary mb-3 tracking-tight">TellyTax</h1>
      <p class="text-xl text-muted-foreground mb-4">Your personal AI-curated news digest, delivered daily.</p>
      <p class="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">Pick your topics, get a beautifully crafted email every morning with Big Picture analysis, weekly trends, and today&rsquo;s updates &mdash; all researched by AI.</p>
      <button id="create-btn" class="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-lg h-12 px-8 hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Create My Digest</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-5">
      <div class="bg-card rounded-xl p-6 text-center">
        <div class="text-3xl mb-3">&#x1F50D;</div>
        <h3 class="text-primary font-semibold mb-2">AI-Researched</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Claude searches the web daily for your topics, finding the most relevant news.</p>
      </div>
      <div class="bg-card rounded-xl p-6 text-center">
        <div class="text-3xl mb-3">&#x1F4E7;</div>
        <h3 class="text-primary font-semibold mb-2">Daily Email</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">A clean, structured digest lands in your inbox every morning at 8am UTC.</p>
      </div>
      <div class="bg-card rounded-xl p-6 text-center">
        <div class="text-3xl mb-3">&#x1F9E0;</div>
        <h3 class="text-primary font-semibold mb-2">Context-Aware</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Tracks developing stories and avoids repetition by remembering past digests.</p>
      </div>
    </div>
  </div>
  <script>
    document.getElementById('create-btn').addEventListener('click', async () => {
      const btn = document.getElementById('create-btn');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      try {
        const res = await fetch('/api/create', { method: 'POST' });
        const { id } = await res.json();
        window.location.href = '/d/' + id;
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Create My Digest';
        alert('Failed to create digest. Please try again.');
      }
    });
  </script>
</body>
</html>`;
}
