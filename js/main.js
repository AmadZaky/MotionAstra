(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    data = window.MA_PRESETS,
    bridge = window.MotionAstraBridge;
  const state = {
      tab: "Text",
      preset: null,
      params: {},
      busy: false,
      query: "",
      drafts: {},
      draftEdits: {},
      draftInvalid: {},
      invalid: new Set(),
      target: null,
      loadedLayout: null,
      loadedProgress: null,
      loadedChoice: null,
      dirty: false,
      editedParameters: new Set(),
    },
    history = [];
  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, String(v));
      } catch (e) {}
    },
  };
  let timer,
    pendingRemove = null;
  function icon() {
    if (window.lucide) lucide.createIcons();
  }
  function notice(message, level = "info") {
    clearTimeout(timer);
    $("notice-text").textContent = message;
    $("notice-icon").textContent =
      { info: "i", success: "✓", warning: "!", error: "×" }[level] || "i";
    $("notice").dataset.level = level;
    $("notice").classList.add("visible");
    timer = setTimeout(() => $("notice").classList.remove("visible"), 3500);
    history.unshift({ message, level, time: new Date().toLocaleTimeString() });
    history.splice(30);
    $("history").textContent = "";
    history.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.time + " · " + item.level + " · " + item.message;
      $("history").appendChild(li);
    });
  }
  function busy(value) {
    state.busy = value;
    if (state.preset)
      state.draftInvalid[state.preset.id] = state.invalid.size > 0;
    MotionPreview.suspend(value);
    document
      .querySelectorAll("[data-host]")
      .forEach((b) => (b.disabled = value || !bridge.isReady()));
    $("apply").disabled = $("apply").disabled || state.invalid.size > 0;
    $("compact-fx").disabled =
      $("compact-fx").disabled ||
      !state.target ||
      state.loadedLayout !== "legacy";
    $("update").disabled = $("update").disabled || state.invalid.size > 0;
    document.querySelectorAll(".card-apply").forEach((b) => {
      b.disabled = b.disabled || !!state.draftInvalid[b.dataset.preset];
    });
    document
      .querySelectorAll(
        "#parameters input,#parameters select,#parameters textarea",
      )
      .forEach((e) => (e.disabled = value));
    if (window.ZxTSelection) {
      const gate = (b, category, id, operation, target) => {
        const result = ZxTSelection.eligibility(category, id, operation, target);
        b.disabled = b.disabled || !result.allowed;
        b.title = result.reason;
        return result;
      };
      if (state.preset) {
        const info = gate($("apply"), state.preset.category, state.preset.id, "apply", null);
        const updateInfo = gate($("update"), state.preset.category, state.preset.id, "update", state.target);
        $("target-guidance").textContent = state.target ? updateInfo.reason : info.reason;
      }
      document.querySelectorAll(".card-apply").forEach(b => {
        const p = data.presets.find(p => p.id === b.dataset.preset);
        if (p) gate(b, p.category, p.id, "apply", null);
      });
    }
    if (window.MotionAstraYUUI) window.MotionAstraYUUI.setBusy(value);
    if (window.MotionCurve) window.MotionCurve.setBusy(value);
    if (window.MotionAstraCreate) window.MotionAstraCreate.setBusy(value);
  }
  async function refresh() {
    if (state.busy) return;
    if (!bridge.isAvailable()) {
      $("status").textContent = "Browser preview · install in AE to apply";
      $("connection").textContent =
        "Preview mode. No After Effects connection.";
      if (window.ZxTSelection) ZxTSelection.update(null, false);
      busy(false);
      return;
    }
    try {
      const r = await bridge.call({ action: "status" });
      if (window.ZxTSelection) ZxTSelection.update(r, true);
      $("status").textContent = r.composition
        ? `${r.composition} · ${r.selected} selected`
        : "AE connected · open a composition";
      $("connection").textContent =
        `After Effects ${r.version} · ZxT-Motions ${r.hostVersion} · ${r.build || "older build"}`;
    } catch (e) {
      if (window.ZxTSelection) ZxTSelection.update(null, false);
      $("status").textContent = e.message;
      $("connection").textContent = e.message;
    }
    busy(state.busy);
  }
  async function action(payload) {
    if (state.busy) return null;
    busy(true);
    try {
      const r = await bridge.call(JSON.parse(JSON.stringify(payload)));
      if (r.changed > 0 && ["apply", "update", "generateBackground"].includes(payload.action)) {
        if (state.draftEdits[payload.id]) state.draftEdits[payload.id].clear();
        if (state.preset && state.preset.id === payload.id) {
          state.editedParameters.clear();
          state.loadedProgress = state.params.progress;
          state.loadedChoice = state.params.choice;
          state.dirty = false;
        }
      }
      if (window.ZxTCollections && r.changed > 0) {
        if (["apply", "update", "generateBackground"].includes(payload.action)) ZxTCollections.record("core:" + payload.id);
        if (payload.action === "yuText" && payload.operation === "apply") ZxTCollections.record("yu:" + payload.id);
      }
      if (r.message) notice(r.message, r.severity || "success");
      return r;
    } catch (e) {
      notice(e.message, "error");
      return null;
    } finally {
      busy(false);
      refresh();
    }
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  document.addEventListener("zxt-open-animation", () => close());
  function close() {
    if (state.busy) return;
    $("inspector").hidden = true;
    $("workspace").classList.remove("inspecting");
    MotionPreview.play($("preview"), false);
  }
  function tab(name) {
    if (name === "Text") name = "YU";
    state.tab = name;
    $("collection-filters").hidden = !["YU", "Background"].includes(name);
    close();
    $("library").hidden = !["YU", "Background"].includes(name);
    if (name === "YU") $("text-tools-group").appendChild($("library"));
    else document.querySelector("main").prepend($("library"));
    $("tools").hidden = name !== "Tools";
    $("create").hidden = name !== "Create";
    if (window.MotionAstraCreate && name === "Create")
      window.MotionAstraCreate.activate();
    $("settings").hidden = name !== "Settings";
    $("yu").hidden = name !== "YU";
    $("motion-curve").hidden = name !== "Curve";
    if (window.MotionCurve) window.MotionCurve.setVisible(name === "Curve");
    if (window.MotionAstraYUUI)
      window.MotionAstraYUUI.setVisible(name === "YU");
    document.querySelectorAll("[data-tab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === name);
      b.setAttribute("aria-pressed", String(b.dataset.tab === name));
    });
    if (["YU", "Background"].includes(name)) {
      state.query = "";
      $("library-kicker").textContent =
        name === "YU" ? "TEXT TOOLS FX" : "SOLIDGEN";
      $("library-title").textContent =
        name === "YU" ? "Text Tools FX" : "A little atmosphere.";
      $("library-help").textContent =
        name === "YU"
          ? "6 customizable presets · select a text layer before applying."
          : "Choose a style to generate its own background layer.";
      render();
    }
    document.querySelector("main").scrollTop = 0;
  }
  function render() {
    MotionPreview.clear();
    $("cards").textContent = "";
    const list = ZxTCollections.filter(data.presets.filter(
      (p) =>
        p.category === (state.tab === "YU" ? "Text" : state.tab) &&
        `${p.name} ${p.description}`.toLowerCase().includes(state.query),
    ), p => "core:" + p.id);
    list.forEach((p, i) => {
      const article = el("article", "card"),
        view = el("button", "card-preview"),
        canvas = el("canvas");
      canvas.width = 440;
      canvas.height = 440;
      view.setAttribute("aria-label", "Customize " + p.name);
      view.append(
        canvas,
        el("span", "card-number", String(i + 1).padStart(2, "0")),
      );
      view.onclick = () => open(p);
      const content = el("div", "card-content");
      content.append(
        el(
          "span",
          "type",
          p.category === "Text" ? "TEXT ANIMATION" : "PROCEDURAL BACKGROUND",
        ),
        el("h2", "", p.name),
        el("p", "", p.description),
      );
      const actions = el("div", "card-actions"),
        button = el("button", "customize", "Customize"),
        apply = el(
          "button",
          "primary card-apply",
          p.category === "Background"
            ? "Generate Background"
            : "Apply / Update",
        );
      button.onclick = () => open(p);
      apply.dataset.host = "";
      apply.dataset.preset = p.id;
      apply.setAttribute(
        "aria-label",
        (p.category === "Background" ? "Generate Background: " : "Apply FX: ") +
          p.name,
      );
      apply.onclick = () => {
        if (state.busy || state.draftInvalid[p.id]) return;
        const values = {};
        p.parameters.forEach(
          (d) =>
            (values[d.id] =
              state.drafts[p.id] && state.drafts[p.id][d.id] !== undefined
                ? state.drafts[p.id][d.id]
                : d.default),
        );
        action({
          action: p.category === "Background" ? "generateBackground" : "apply",
          id: p.id,
          params: values,
          editedParameters: state.draftEdits[p.id] ? Array.from(state.draftEdits[p.id]) : undefined,
          editProgress: !!(state.draftEdits[p.id] && state.draftEdits[p.id].has("progress")),
          editChoice: !!(state.draftEdits[p.id] && state.draftEdits[p.id].has("choice")),
          smart: true,
          layout: $("control-layout").value || "compact",
        });
      };
      actions.append(button, apply);
      content.appendChild(actions);
      article.append(view, content, ZxTCollections.button("core:" + p.id, p.name));
      $("cards").appendChild(article);
      MotionPreview.attach(canvas, p);
      article.onmouseenter = () => MotionPreview.play(canvas, true);
      article.onmouseleave = () => MotionPreview.play(canvas, false);
      article.onfocusin = () => MotionPreview.play(canvas, true);
      article.onfocusout = () => MotionPreview.play(canvas, false);
    });
    if (!list.length)
      $("cards").appendChild(el("p", "empty", ZxTCollections.empty()));
    busy(state.busy);
  }
  function preview() {
    if (state.preset)
      MotionPreview.attach($("preview"), state.preset, state.params, true);
  }
  function checkboxValue(value) {
    let v = value;
    for (let i = 0; i < 4 && v !== null && typeof v === "object"; i++) {
      if (Array.isArray(v) && v.length === 1) v = v[0];
      else if (
        Object.keys(v).length === 1 &&
        Object.prototype.hasOwnProperty.call(v, "value")
      )
        v = v.value;
      else break;
    }
    if (v === true || v === 1) return true;
    if (v === false || v === 0) return false;
    if (typeof v === "string") {
      const t = v.trim().toLowerCase();
      if (["true", "on", "checked"].includes(t)) return true;
      if (["false", "off", "unchecked"].includes(t)) return false;
      if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/.test(t)) {
        const n = Number(t);
        if (n === 0 || n === 1) return n === 1;
      }
    }
    throw Error("Invalid checkbox value");
  }
  function parameters() {
    state.invalid.clear();
    $("parameters").textContent = "";
    const groups = {};
    state.preset.parameters.forEach((d) => {
      if (!groups[d.group]) {
        const g = el("details", "parameter-group");
        g.open = true;
        g.appendChild(el("summary", "", d.group));
        $("parameters").appendChild(g);
        groups[d.group] = g;
      }
      const row = el("div", "parameter"),
        label = el("label", "", d.label),
        input = el(
          d.type === "select"
            ? "select"
            : d.type === "textarea"
              ? "textarea"
              : "input",
        );
      input.id = "param-" + d.id;
      label.htmlFor = input.id;
      const live = d.id === "progress" || d.id === "choice";
      label.appendChild(el("small", "control-kind", live ? "AE keyframes" : "Panel setting"));
      if (live) label.title = d.id === "choice" ? "Enable Choice slider mode. Animate MA2 choice in AE; explicit panel edits add a key at the playhead when already animated." : "Enable manual Progress. Animate the native Progress slider in AE; explicit panel edits add a key at the playhead when already animated.";
      row.dataset.search = (d.label + " " + d.group).toLowerCase();
      row.appendChild(label);
      const change = (v) => {
        state.params[d.id] = v;
        state.dirty = true;
        state.editedParameters.add(d.id);
        state.invalid.delete(d.id);
        input.removeAttribute("aria-invalid");
        preview();
        busy(state.busy);
      };
      if (d.type === "select") {
        d.options.forEach((o) => {
          const opt = el("option", "", o.label);
          opt.value = o.value;
          input.appendChild(opt);
        });
        input.value = state.params[d.id];
        input.onchange = () => change(Number(input.value));
      } else if (d.type === "checkbox") {
        input.type = "checkbox";
        try {
          input.checked = checkboxValue(state.params[d.id]);
          state.params[d.id] = input.checked;
        } catch (e) {
          input.checked = false;
          state.invalid.add(d.id);
          input.setAttribute("aria-invalid", "true");
          notice(d.label + ": choose ON or OFF before applying.", "warning");
        }
        input.onchange = () => change(input.checked);
      } else if (d.type === "range" || d.type === "number") {
        input.type = d.type;
        input.min = d.min;
        input.max =
          d.id === "duration"
            ? Math.max(d.max, Number(state.params[d.id]))
            : d.max;
        input.step = d.step;
        input.value = state.params[d.id];
        input.className = d.type === "number" ? "wide" : "";
        let exact = null;
        const commit = (e) => {
          const v = Number(e.value);
          if (
            e.value === "" ||
            !Number.isFinite(v) ||
            v < Number(input.min) ||
            v > Number(input.max) ||
            (d.step === 1 && !Number.isInteger(v))
          ) {
            state.invalid.add(d.id);
            e.setAttribute("aria-invalid", "true");
            busy(state.busy);
            return;
          }
          e.removeAttribute("aria-invalid");
          input.value = v;
          if (exact) exact.value = v;
          change(v);
        };
        if (d.type === "range") {
          exact = el("input", "exact");
          exact.type = "number";
          exact.id = "exact-" + d.id;
          exact.min = input.min;
          exact.max = input.max;
          exact.step = d.step;
          exact.value = input.value;
          exact.setAttribute("aria-label", d.label + " exact value");
          exact.oninput = () => commit(exact);
          row.appendChild(exact);
        }
        input.oninput = () => commit(input);
      } else {
        if (d.type !== "textarea") input.type = d.type;
        input.value = state.params[d.id];
        if (d.maxLength) input.maxLength = d.maxLength;
        input.className = d.type === "color" ? "" : "wide";
        input.oninput = () => change(input.value);
      }
      row.appendChild(input);
      groups[d.group].appendChild(row);
    });
    busy(state.busy);
  }
  function open(p, values, loaded) {
    if (state.busy) return;
    if (window.MotionAstraYUUI) window.MotionAstraYUUI.setVisible(state.tab === "YU");
    values = values || state.drafts[p.id];
    state.preset = p;
    state.target = loaded ? loaded.target : null;
    state.loadedLayout = loaded ? loaded.layout : null;
    state.loadedProgress = loaded ? loaded.params.progress : null;
    state.loadedChoice = loaded ? loaded.params.choice : null;
    state.dirty = false;
    state.editedParameters = loaded ? new Set() : (state.draftEdits[p.id] || new Set());
    state.draftEdits[p.id] = state.editedParameters;
    state.params = {};
    p.parameters.forEach(
      (d) =>
        (state.params[d.id] =
          values && values[d.id] !== undefined ? values[d.id] : d.default),
    );
    state.drafts[p.id] = state.params;
    $("fx-title").textContent = p.name;
    $("inspector-mode").textContent = loaded
      ? "FX TWEAKER"
      : "CUSTOMIZE PRESET";
    $("tweaker-context").hidden = !loaded;
    $("apply").hidden = !!loaded;
    document
      .querySelector(".inspector-actions")
      .classList.toggle("tweaking", !!loaded);
    $("loaded-layer").textContent = loaded ? loaded.layerName : "";
    $("loaded-layout").textContent = loaded
      ? loaded.layout === "compact"
        ? "Compact"
        : "Individual"
      : "";
    $("compact-fx").hidden = !loaded || loaded.layout !== "legacy";
    $("compact-help").hidden = !loaded || loaded.layout !== "legacy";
    $("parameter-search").value = "";
    $("fx-description").textContent = p.description;
    $("apply").textContent =
      p.category === "Background" ? "Generate Background" : "Apply / Update";
    $("update").textContent = loaded ? "Update selected FX" : "Update";
    $("structural-help").hidden = !p.parameters.some((d) => d.id === "count");
    $("inspector").hidden = false;
    $("workspace").classList.add("inspecting");
    parameters();
    preview();
    $("parameter-help").textContent =
      (p.category === "Background"
        ? "Generate updates a matching selected background; otherwise it creates one. Deselect backgrounds to create another copy. "
        : "") +
      (p.id === "switcher"
        ? "Choice slider mode: animate MA2 choice in AE Effect Controls (1 = first phrase). Panel changes take effect on Update. Automatic mode ignores Choice. "
        : "") +
      "Animation starts at the layer in-point. Drag [FX End] to retime; Loop mode: None, Ping-Pong, Cycle or Continue. Static backgrounds freeze at the start. Use FX Tweaker for settings. Compact mode keeps one Progress controller; enable manual Progress to animate it. Panel settings apply on Update. Unchanged animated colors and sliders are preserved. Editing an animated value adds a key at the playhead. Count rebuilds artwork only when it has no custom animation.";
    document.querySelector(".inspector-scroll").scrollTop = 0;
    $("inspector").scrollTop = 0;
    $("close").focus();
  }
  async function load() {
    const r = await action({ action: "load" });
    if (r && r.id) {
      const p = data.presets
        .concat(data.legacy || [])
        .find((p) => p.id === r.id);
      if (p) {
        tab("Tools");
        open(p, r.params, r);
      }
    }
  }
  $("tweaker-load").onclick = load;
  $("compact-fx").onclick = async () => {
    if (!state.target) return;
    if (state.dirty) {
      notice(
        "Update or reload your edited settings before compacting.",
        "warning",
      );
      return;
    }
    const r = await action({ action: "compact", target: state.target });
    if (r && r.changed) load();
  };
  $("parameter-search").oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    document
      .querySelectorAll("#parameters .parameter")
      .forEach((row) => (row.hidden = !row.dataset.search.includes(q)));
    document
      .querySelectorAll("#parameters .parameter-group")
      .forEach((group) => {
        group.hidden = !Array.from(group.querySelectorAll(".parameter")).some(
          (row) => !row.hidden,
        );
        if (q) group.open = true;
      });
  };
  function tool(name, extra = {}) {
    return action(Object.assign({ action: "tool", name }, extra));
  }
  $("close").onclick = close;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  $("apply").onclick = () => {
    if (state.preset && !state.invalid.size)
      action({
        action:
          state.preset.category === "Background"
            ? "generateBackground"
            : "apply",
        id: state.preset.id,
        params: state.params,
        editedParameters: Array.from(state.editedParameters),
        editProgress: state.editedParameters.has("progress"),
        editChoice: state.editedParameters.has("choice"),
        smart: true,
        layout: $("control-layout").value || "compact",
      });
  };
  $("update").onclick = async () => {
    if (state.preset && !state.invalid.size) {
      const r = await action({
        action: "update",
        editedParameters: Array.from(state.editedParameters),
        id: state.preset.id,
        params: state.params,
        target: state.target,
        editChoice: state.editedParameters.has("choice"),
        editProgress: state.editedParameters.has("progress"),
        smart: true,
        layout: $("control-layout").value || "compact",
      });
      if (r && r.changed) {
        state.dirty = false;
        state.editedParameters.clear();
        state.loadedProgress = state.params.progress;
        state.loadedChoice = state.params.choice;
      }
    }
  };
  $("load-fx").onclick = () => {
    if (
      state.tab === "YU" &&
      !$("yu-editor").hidden &&
      $("inspector").hidden &&
      window.MotionAstraYUUI
    )
      return window.MotionAstraYUUI.load();
    return load();
  };
  $("reset").onclick = () => {
    if (state.preset) {
      delete state.drafts[state.preset.id];
      const current = state.target
        ? {
            target: state.target,
            layout: state.loadedLayout,
            layerName: $("loaded-layer").textContent,
            params: { progress: state.loadedProgress, choice: state.loadedChoice },
          }
        : null;
      open(state.preset, {}, current);
      state.preset.parameters.forEach(d => state.editedParameters.add(d.id));
      state.dirty = true;
    }
  };
  $("replay").onclick = preview;
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!state.busy) tab(b.dataset.tab);
      }),
  );
  const glyphs = ["↖", "↑", "↗", "←", "·", "→", "↙", "↓", "↘"];
  glyphs.forEach((g, i) => {
    const b = el("button", "", g);
    b.dataset.host = "";
    b.setAttribute("aria-label", "Anchor " + (i + 1));
    b.onclick = () =>
      tool("anchor", {
        x: (i % 3) / 2,
        y: Math.floor(i / 3) / 2,
        keep: $("anchor-keep").checked,
      });
    $("anchor-grid").appendChild(b);
  });
  $("quick-anchor").onclick = () =>
    tool("anchor", { x: 0.5, y: 0.5, keep: $("anchor-keep").checked });
  $("anchor-custom").onclick = () =>
    tool("anchor", {
      x: Number($("anchor-x").value) / 100,
      y: Number($("anchor-y").value) / 100,
      keep: $("anchor-keep").checked,
    });
  document.querySelectorAll("[data-tool]").forEach((b) => {
    b.onclick = () => tool(b.dataset.tool);
  });
  document
    .querySelectorAll("[data-order]")
    .forEach(
      (b) => (b.onclick = () => tool("arrange", { mode: b.dataset.order })),
    );
  document.querySelectorAll("[data-ease]").forEach(
    (b) =>
      (b.onclick = () =>
        tool("ease", {
          mode: b.dataset.ease,
          strength: Number($("ease-strength").value),
        })),
  );
  document
    .querySelectorAll("[data-align]")
    .forEach(
      (b) => (b.onclick = () => tool("align", { mode: b.dataset.align })),
    );
  document
    .querySelectorAll("[data-distribute]")
    .forEach(
      (b) =>
        (b.onclick = () => tool("distribute", { axis: b.dataset.distribute })),
    );
  $("stagger").onclick = () =>
    tool("stagger", { seconds: Number($("stagger-seconds").value) });
  $("rename").onclick = () =>
    tool("rename", { prefix: $("rename-prefix").value });
  $("offset").onclick = () =>
    tool("offset", {
      x: Number($("offset-x").value),
      y: Number($("offset-y").value),
      z: Number($("offset-z").value),
    });
  $("text-style").onclick = () =>
    tool("style", {
      size: Number($("text-size").value),
      color: $("text-color").value,
      align: $("text-align").value,
    });
  function review(name) {
    pendingRemove = name;
    $("review").hidden = false;
    $("review-text").textContent =
      name === "eraseAll"
        ? "Remove ALL native/third-party Effects stacks and ZxT-Motions animation from the current selected layers? Other expressions may depend on removed effects. Generated artwork will be removed. Transition layers are disabled; project source comps remain."
        : "Remove ZxT-Motions / legacy MotionAstra animation, controls and generated artwork from selected layers? Unrelated effects remain. Transition layers are disabled after removal. Other layers and project sources are not deleted.";
    $("review").scrollIntoView({ block: "nearest" });
  }
  $("remove-owned").onclick = () => review("remove");
  $("erase-all").onclick = () => review("eraseAll");
  $("cancel-remove").onclick = () => {
    $("review").hidden = true;
    pendingRemove = null;
  };
  $("confirm-remove").onclick = () => {
    if (pendingRemove) {
      const name = pendingRemove;
      pendingRemove = null;
      $("review").hidden = true;
      tool(name);
    }
  };
  $("control-layout").value =
    store.get("ma-control-layout") === "legacy" ? "legacy" : "compact";
  $("control-layout").onchange = (e) =>
    store.set("ma-control-layout", e.target.value);
  $("show-history").onclick = () => {
    tab("Settings");
    $("history").scrollIntoView({ block: "nearest" });
  };
  $("refresh").onclick = refresh;
  $("diagnose").onclick = async () => {
    await refresh();
    let host;
    try {
      host = await bridge.call({ action: "diagnostics" });
    } catch (e) {
      host = { error: e.message };
    }
    const details = bridge.diagnostics ? bridge.diagnostics() : {};
    $("diagnostic-report").hidden = false;
    $("diagnostic-report").value = JSON.stringify(
      {
        panel: details,
        host,
        connection: $("connection").textContent,
        recentOperations: history.slice(0, 5),
      },
      null,
      2,
    );
    $("diagnostic-report").focus();
    $("diagnostic-report").select();
  };
  $("reduced").checked = store.get("ma2-reduced") === "true";
  document.body.classList.toggle("reduced", $("reduced").checked);
  $("reduced").onchange = (e) => {
    store.set("ma2-reduced", e.target.checked);
    document.body.classList.toggle("reduced", e.target.checked);
    preview();
  };
  function disclosure(button, target, key, label) {
    const b = $(button),
      panel = $(target);
    function set(on) {
      panel.hidden = on;
      b.setAttribute("aria-expanded", String(!on));
      b.textContent = label + (on ? " ▾" : " ▴");
    }
    set(store.get(key) === "true");
    b.onclick = () => {
      const on = !panel.hidden;
      set(on);
      store.set(key, on);
    };
  }
  if (window.MotionCurve)
    window.MotionCurve.init({ action: action, ready: () => bridge.isReady() });
  if (window.MotionAstraYUUI)
    window.MotionAstraYUUI.init({
      action: action,
      ready: () => bridge.isReady(),
    });
  if (window.MotionAstraCreate)
    window.MotionAstraCreate.init({
      action,
      ready: () => bridge.isReady(),
      notice,
    });
  disclosure("fold-nav", "nav", "ma2-nav", "Menu");
  disclosure("fold-quick", "quick", "ma252-create", "Quick");
  if (window.MotionAstraSearch)
    window.MotionAstraSearch.init({ tab, open, busy: () => state.busy });
  $("text-tools-group").open = store.get("ma-text-tools-folded") !== "true";
  $("text-tools-group").ontoggle = () => {
    store.set("ma-text-tools-folded", !$("text-tools-group").open);
  };
  if (window.ZxTSelection) ZxTSelection.init({
    refresh, busy: () => state.busy, loadCore: load,
    loadAnimation: phase => { tab("YU"); return window.MotionAstraYUUI.load(phase); }
  });
  if (window.ZxTCollections) {
    document.querySelectorAll("[data-collection]").forEach(b => b.onclick = () => ZxTCollections.setMode(b.dataset.collection));
    ZxTCollections.subscribe(() => {
      document.querySelectorAll("[data-collection]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.collection === ZxTCollections.mode)));
      if (["YU", "Background"].includes(state.tab)) render();
      if (window.MotionAstraYUUI) window.MotionAstraYUUI.refreshCollection();
      busy(state.busy);
    });
  }
  tab("YU");
  busy(false);
  refresh();
  icon();
  window.addEventListener("focus", refresh);
  setInterval(() => {
    if (!document.hidden && !state.busy) refresh();
  }, 4000);
})();
