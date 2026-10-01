/* Native layer creation: host fonts, editable shape geometry and recent colors. */
window.MotionAstraCreate = (() => {
  const $ = (id) => document.getElementById(id);
  const hex = (value) => {
    const text = value.trim().replace(/^#/, "");
    return /^[0-9a-f]{6}$/i.test(text) ? "#" + text.toUpperCase() : null;
  };
  let api,
    fonts = [],
    loaded = false,
    loading = false,
    busy = false,
    recent = [];
  function option(select, value, label) {
    const node = document.createElement("option");
    node.value = value;
    node.textContent = label;
    select.appendChild(node);
  }
  function styles(previous) {
    const select = $("new-text-style"),
      family = $("new-text-font").value;
    select.textContent = "";
    const faces = fonts.filter((f) => f.family === family);
    if (!faces.length) option(select, "", "Current style");
    else faces.forEach((f) => option(select, f.value, f.style));
    const regular = faces.find((f) =>
      /^(regular|normal|roman|book)$/i.test(f.style),
    );
    if (faces.some((f) => f.value === previous)) select.value = previous;
    else if (regular) select.value = regular.value;
  }
  function filterFonts() {
    const select = $("new-text-font"),
      chosen = select.value,
      style = $("new-text-style").value;
    const query = $("font-search").value.trim().toLocaleLowerCase();
    const families = [
      ...new Set(
        fonts
          .filter((f) =>
            (f.family + " " + f.style + " " + f.value)
              .toLocaleLowerCase()
              .includes(query),
          )
          .map((f) => f.family),
      ),
    ];
    const visible =
      chosen &&
      fonts.some((f) => f.family === chosen) &&
      !families.includes(chosen)
        ? [chosen, ...families]
        : families;
    select.textContent = "";
    option(select, "", "Current AE font");
    visible.forEach((f) => option(select, f, f));
    if (visible.includes(chosen)) select.value = chosen;
    styles(style);
    $("font-status").textContent = loaded
      ? families.length
        ? `${families.length} matching families · styles from AE`
        : "No matching font families. Try another search."
      : "Connect to After Effects to load its fonts.";
  }
  async function loadFonts() {
    if (loading || busy || !api.ready()) return;
    loading = true;
    $("font-status").textContent = "Loading fonts from After Effects…";
    try {
      const result = await api.action({ action: "fonts" });
      if (result && Array.isArray(result.fonts)) {
        fonts = result.fonts.filter((f) => f.family && f.style && f.value);
        loaded = true;
        filterFonts();
        if (!fonts.length)
          $("font-status").textContent =
            result.message ||
            "No fonts available. Activate a font in AE, then refresh.";
      } else
        $("font-status").textContent =
          "Could not load AE fonts. Refresh to retry.";
    } finally {
      loading = false;
    }
  }
  function updateHex(value) {
    const color = hex(value);
    $("background-hex").setCustomValidity(
      color ? "" : "Use six hexadecimal digits, for example #FF943F.",
    );
    $("background-hex").setAttribute("aria-invalid", String(!color));
    $("background-color-error").textContent = color
      ? ""
      : "Enter six hex digits, such as #FF943F.";
    if (color) $("new-background-color").value = color;
    return color;
  }
  function renderColors() {
    const box = $("recent-colors");
    box.textContent = "";
    if (!recent.length) {
      const hint = document.createElement("span");
      hint.className = "hint";
      hint.textContent = "Your next background color will appear here.";
      box.appendChild(hint);
    }
    recent.forEach((color) => {
      const b = document.createElement("button");
      b.type = "button";
      b.style.backgroundColor = color;
      b.title = color;
      b.setAttribute("aria-label", "Use " + color);
      b.onclick = () => {
        $("background-hex").value = color;
        updateHex(color);
      };
      box.appendChild(b);
    });
  }
  function remember(color) {
    recent = [color, ...recent.filter((c) => c !== color)].slice(0, 8);
    try {
      localStorage.setItem("ma-create-colors", JSON.stringify(recent));
    } catch (ignore) {}
    renderColors();
  }
  async function submit(event, kind) {
    event.preventDefault();
    if (busy || !api.ready()) return;
    const form = event.currentTarget;
    if (kind === "newSolid") updateHex($("background-hex").value);
    if (!form.reportValidity()) return;
    let payload = { action: "tool", name: kind };
    if (kind === "newShape")
      Object.assign(payload, {
        shape: $("new-shape-type").value,
        size: Number($("new-shape-size").value),
        sides: Number($("new-shape-sides").value),
        color: $("new-layer-color").value,
      });
    if (kind === "newText")
      Object.assign(payload, {
        text: $("new-text-content").value,
        font: $("new-text-style").value,
        size: Number($("new-text-size").value),
        color: $("new-text-color").value,
      });
    if (kind === "newSolid")
      Object.assign(payload, {
        color: hex($("background-hex").value),
        background: true,
      });
    const result = await api.action(payload);
    if (kind === "newSolid" && result && result.changed)
      remember(payload.color);
  }
  function setBusy(value) {
    busy = value;
    if (!api) return;
    document
      .querySelectorAll(
        "#create input,#create select,#create textarea,#create button",
      )
      .forEach((e) => {
        e.disabled = value || (e.hasAttribute("data-host") && !api.ready());
      });
    $("new-shape-sides").disabled =
      value || $("new-shape-type").value !== "polygon";
  }
  function activate() {
    if (api && !loaded) loadFonts();
  }
  function init(options) {
    api = options;
    try {
      const saved = JSON.parse(
        localStorage.getItem("ma-create-colors") || "[]",
      );
      if (Array.isArray(saved))
        recent = [
          ...new Set(
            saved.filter((c) => typeof c === "string" && hex(c)).map(hex),
          ),
        ].slice(0, 8);
    } catch (ignore) {}
    renderColors();
    $("new-shape-type").onchange = () => {
      $("polygon-field").hidden = $("new-shape-type").value !== "polygon";
      setBusy(busy);
    };
    $("new-shape-type").onchange();
    $("font-search").oninput = filterFonts;
    $("font-search").onfocus = activate;
    $("new-text-font").onchange = () => styles();
    $("refresh-fonts").onclick = loadFonts;
    $("background-hex").oninput = () => updateHex($("background-hex").value);
    $("background-hex").onblur = () => {
      const color = updateHex($("background-hex").value);
      if (color) $("background-hex").value = color;
    };
    $("new-background-color").oninput = () => {
      $("background-hex").value = $("new-background-color").value.toUpperCase();
      updateHex($("background-hex").value);
    };
    [
      ["create-shape", "newShape"],
      ["create-text", "newText"],
      ["create-background", "newSolid"],
    ].forEach(([id, kind]) => {
      $(id).onsubmit = (e) => submit(e, kind);
    });
  }
  return { init, activate, setBusy };
})();
