const optionsEl = document.getElementById("options");
const generateBtn = document.getElementById("generate");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");
const urlListEl = document.getElementById("url-list");
const copyAllBtn = document.getElementById("copy-all");

async function loadDefaultOptions() {
  try {
    const res = await fetch("/default-options.txt");
    if (!res.ok) throw new Error("missing");
    const text = (await res.text()).trim();
    if (text) optionsEl.value = text;
  } catch {
    /* leave textarea empty if defaults file is unavailable */
  }
}

loadDefaultOptions();

generateBtn.addEventListener("click", async () => {
  errorEl.hidden = true;
  resultsEl.hidden = true;
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating…";

  const lines = optionsEl.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options: lines }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Generation failed.");
    }

    urlListEl.innerHTML = "";
    data.urls.forEach((url, i) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = `Card ${i + 1}: `;
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = url;
      li.append(label, a);
      urlListEl.appendChild(li);
    });

    resultsEl.hidden = false;
    copyAllBtn.dataset.urls = data.urls.join("\n");
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate 5 cards";
  }
});

copyAllBtn.addEventListener("click", async () => {
  const text = copyAllBtn.dataset.urls;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyAllBtn.textContent = "Copied!";
    setTimeout(() => {
      copyAllBtn.textContent = "Copy all links";
    }, 2000);
  } catch {
    copyAllBtn.textContent = "Copy failed";
  }
});
