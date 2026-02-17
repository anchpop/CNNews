export function dashboardPage(id: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>TellyTax - Dashboard</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container dashboard">
    <header class="dash-header">
      <a href="/" class="logo">TellyTax</a>
      <span class="dash-id">ID: ${id.slice(0, 8)}&hellip;</span>
    </header>

    <section class="card">
      <h2>Email</h2>
      <div class="email-row">
        <input type="email" id="email-input" placeholder="you@example.com">
        <button id="save-email" class="btn btn-small">Save</button>
      </div>
      <p id="email-status" class="status-msg"></p>
    </section>

    <section class="card">
      <h2>Topics</h2>
      <div class="topic-add-row">
        <input type="text" id="topic-input" placeholder="e.g. AI regulation, quantum computing">
        <button id="add-topic" class="btn btn-small">Add</button>
      </div>
      <ul id="topic-list" class="topic-list"></ul>
    </section>

    <section class="card">
      <h2>Digest</h2>
      <div class="digest-actions">
        <button id="trigger-btn" class="btn btn-primary">Generate Digest Now</button>
        <label class="toggle-label">
          <input type="checkbox" id="enabled-toggle">
          Daily emails enabled
        </label>
      </div>
      <p id="trigger-status" class="status-msg"></p>
    </section>

    <section class="card">
      <h2>History</h2>
      <div id="digest-history"></div>
    </section>
  </div>
  <script>const DIGEST_ID = "${id}";</script>
  <script type="module" src="/client.js"></script>
</body>
</html>`;
}
