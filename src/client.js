import YProvider from "y-partyserver/provider";
import * as Y from "yjs";

const doc = new Y.Doc();
const provider = new YProvider(location.host, DIGEST_ID, doc, {
  party: "digest-object",
});

const config = doc.getMap("config");
const topicsArr = doc.getArray("topics");
const digestsArr = doc.getArray("digests");

const $ = (sel) => document.querySelector(sel);

// Render on sync and on changes
provider.on("synced", () => renderAll());
topicsArr.observe(() => renderTopics());
digestsArr.observeDeep(() => renderDigests());
config.observe(() => renderConfig());

function renderAll() {
  renderConfig();
  renderTopics();
  renderDigests();
}

function renderConfig() {
  const email = config.get("email") || "";
  const enabled = config.get("enabled") || false;
  const input = $("#email-input");
  // Only update if user isn't actively editing
  if (document.activeElement !== input && email) {
    input.value = email;
  }
  $("#enabled-toggle").checked = enabled;
}

function renderTopics() {
  const topics = topicsArr.toArray();
  const list = $("#topic-list");
  list.innerHTML = "";
  topics.forEach((topic, i) => {
    const li = document.createElement("li");
    li.textContent = topic;
    const btn = document.createElement("button");
    btn.className = "btn-danger";
    btn.textContent = "\u00D7";
    btn.onclick = () => topicsArr.delete(i, 1);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderDigests() {
  const digests = digestsArr.toArray();
  const container = $("#digest-history");
  if (!digests.length) {
    container.innerHTML =
      '<p class="empty-state">No digests yet. Add topics and generate your first one!</p>';
    return;
  }
  container.innerHTML = [...digests]
    .reverse()
    .map(
      (d, i) => `
    <div class="digest-entry">
      <div class="digest-entry-header" data-idx="${i}">
        <h3>${escapeHtml(d.subject)}</h3>
        <span class="date">${d.date}</span>
      </div>
      <div class="digest-entry-body" id="digest-body-${i}">
        ${d.sections
          .map(
            (s) => `
          <div class="digest-section-title">${escapeHtml(s.title)}</div>
          <div>${escapeHtml(s.content).replace(/\n/g, "<br>")}</div>
        `
          )
          .join("")}
      </div>
    </div>
  `
    )
    .join("");

  container.querySelectorAll(".digest-entry-header").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .getElementById(`digest-body-${el.dataset.idx}`)
        .classList.toggle("open");
    });
  });
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function showStatus(selector, msg, ok) {
  const el = $(selector);
  el.textContent = msg;
  el.className = `status-msg ${ok ? "ok" : "err"}`;
  if (ok) setTimeout(() => (el.textContent = ""), 3000);
}

// Save email — writes directly to Y.Map
$("#save-email").addEventListener("click", () => {
  const email = $("#email-input").value.trim();
  if (!email) return;
  doc.transact(() => {
    config.set("email", email);
    if (!config.get("enabled")) {
      config.set("enabled", true);
    }
  });
  showStatus("#email-status", "Saved!", true);
});

// Add topic — writes directly to Y.Array
function addTopic() {
  const input = $("#topic-input");
  const topic = input.value.trim();
  if (!topic) return;
  if (!topicsArr.toArray().includes(topic)) {
    topicsArr.push([topic]);
  }
  input.value = "";
}
$("#add-topic").addEventListener("click", addTopic);
$("#topic-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTopic();
});

// Trigger digest — custom message to server
$("#trigger-btn").addEventListener("click", () => {
  const btn = $("#trigger-btn");
  btn.disabled = true;
  btn.textContent = "Generating...";
  showStatus(
    "#trigger-status",
    "This may take a minute while Claude researches your topics...",
    true
  );
  provider.sendMessage(JSON.stringify({ type: "trigger" }));
});

provider.on("custom-message", (msg) => {
  const data = JSON.parse(msg);
  if (data.type === "trigger-result") {
    const btn = $("#trigger-btn");
    btn.disabled = false;
    btn.textContent = "Generate Digest Now";
    if (data.ok) {
      showStatus("#trigger-status", "Digest generated and sent!", true);
    } else {
      showStatus("#trigger-status", data.error || "Failed", false);
    }
  }
});

// Enable toggle — writes directly to Y.Map
$("#enabled-toggle").addEventListener("change", (e) => {
  config.set("enabled", e.target.checked);
});
