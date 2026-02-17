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
  <div class="container landing">
    <div class="hero">
      <h1>TellyTax</h1>
      <p class="tagline">Your personal AI-curated news digest, delivered daily.</p>
      <p class="description">Pick your topics, get a beautifully crafted email every morning with Big Picture analysis, weekly trends, and today's updates &mdash; all researched by AI.</p>
      <button id="create-btn" class="btn btn-primary">Create My Digest</button>
    </div>
    <div class="features">
      <div class="feature">
        <div class="feature-icon">&#x1F50D;</div>
        <h3>AI-Researched</h3>
        <p>Claude searches the web daily for your topics, finding the most relevant news.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">&#x1F4E7;</div>
        <h3>Daily Email</h3>
        <p>A clean, structured digest lands in your inbox every morning at 8am UTC.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">&#x1F9E0;</div>
        <h3>Context-Aware</h3>
        <p>Tracks developing stories and avoids repetition by remembering past digests.</p>
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
