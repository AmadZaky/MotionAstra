/* YU Txt Motion browser integration. Motion engine © 2026 Yu Graphic, MIT. */
window.MotionAstraYUUI = (() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    core = window.YTMCore;
  let api,
    preset = core.presets[0],
    target = null,
    frame = 0,
    visible = false,
    busy = false,
    activeCanvas = null;
  const fields = {
    mode: ["IN", "OUT", "BOTH"],
    group: ["chars", "charsNoSpaces", "words", "lines", "all"],
    order: ["forward", "reverse", "center", "edges", "random", "together"],
    easing: [
      "preset",
      "smooth",
      "cubic",
      "quint",
      "expo",
      "back",
      "bounce",
      "elastic",
      "linear",
      "step",
      "steps",
    ],
    placement: ["edges", "playhead"],
  };
  const labels = {
    chars: "Characters",
    charsNoSpaces: "Characters · no spaces",
    words: "Words",
    lines: "Lines",
    all: "Whole text",
    edges: "Layer edges",
    playhead: "Playhead",
    BOTH: "IN + OUT",
  };
  function node(tag, cls, text) {
    const e = document.createElement(tag);
    e.className = cls || "";
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function defaults(p) {
    return {
      mode: "IN",
      duration: p.duration,
      stagger: p.stagger,
      intensity: 100,
      seed: 1,
      group: p.group,
      order: p.order,
      easing: "preset",
      placement: "edges",
    };
  }
  function values() {
    const o = {};
    Object.keys(fields)
      .concat(["duration", "stagger", "intensity", "seed"])
      .forEach((k) => {
        const e = $("yu-" + k);
        o[k] = e.type === "number" ? Number(e.value) : e.value;
      });
    return o;
  }
  function valid() {
    return Array.from($("yu-controls").querySelectorAll("input,select")).every(
      (e) => e.checkValidity() && e.value !== "",
    );
  }
  function sync() {
    $("yu-apply").hidden = !!target;
    ["yu-apply", "yu-update", "yu-clear"].forEach(
      (id) =>
        ($(id).disabled =
          busy ||
          !api.ready() ||
          (id === "yu-update" && !target) ||
          (["yu-apply", "yu-update"].includes(id) && !valid())),
    );
    $("yu-back").disabled = busy;
    $("yu-controls")
      .querySelectorAll("input,select")
      .forEach((e) => (e.disabled = busy));
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    activeCanvas = null;
  }
  // Uses the author's exact sample/timing functions. Canvas typography is illustrative;
  // AE's native character/word/line selectors determine final glyph layout.
  function draw(canvas, p, o, t) {
    const ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b0b0d";
    ctx.fillRect(0, 0, w, h);
    const groups =
      o.group === "all"
        ? ["ZxT-Motions"]
        : o.group === "words"
          ? ["ZxT-Motions"]
          : o.group === "lines"
            ? ["ZxT-Motions"]
            : Array.from("ZxT-Motions");
    const size = o.group === "all" ? 36 : 40;
    ctx.font = "600 " + size + "px Arial";
    const widths = groups.map((s) => ctx.measureText(s).width),
      gap = o.group === "words" ? 12 : 3,
      total = widths.reduce((a, b) => a + b, 0) + (groups.length - 1) * gap;
    let x = (w - total) / 2;
    groups.forEach((text, i) => {
      const n = groups.length,
        span = o.duration + o.stagger * core.rankSpan(n, o.order),
        phase =
          o.mode === "OUT"
            ? "OUT"
            : o.mode === "BOTH" && t > span + 0.7
              ? "OUT"
              : "IN",
        start = phase === "OUT" && o.mode === "BOTH" ? span + 0.7 : 0;
      const u = core.timing(
          t,
          start,
          o.duration,
          o.stagger,
          i,
          n,
          o.order,
          o.seed,
          phase,
          null,
        ),
        v = core.sample(
          p,
          u,
          i,
          n,
          o.seed,
          o.intensity,
          o.easing === "preset" ? p.ease : o.easing,
        );
      ctx.save();
      ctx.translate(
        o.group === "lines" ? w / 2 : x + widths[i] / 2,
        o.group === "lines" ? h / 2 - 24 + i * 48 : h / 2,
      );
      ctx.translate(v.x, v.y);
      ctx.rotate((v.rotation * Math.PI) / 180);
      ctx.transform(1, 0, Math.tan((v.skew * Math.PI) / 180), 1, 0, 0);
      ctx.scale(v.sx / 100, v.sy / 100);
      ctx.globalAlpha = v.opacity;
      ctx.filter = v.blur ? "blur(" + v.blur + "px)" : "none";
      ctx.fillStyle = "#ff943f";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 0);
      ctx.restore();
      x += widths[i] + gap;
    });
  }
  function play(canvas, p, o) {
    stop();
    activeCanvas = canvas;
    const started = performance.now(),
      length = o.duration + o.stagger * core.rankSpan(9, o.order),
      end = o.mode === "BOTH" ? length * 2 + 1.2 : length + 0.6;
    function tick(now) {
      if (
        !visible ||
        busy ||
        document.hidden ||
        document.body.classList.contains("reduced")
      ) {
        draw(canvas, p, o, o.mode === "OUT" ? 0 : length);
        stop();
        return;
      }
      const t = (now - started) / 1000;
      draw(canvas, p, o, Math.min(t, end));
      if (t < end) frame = requestAnimationFrame(tick);
      else stop();
    }
    frame = requestAnimationFrame(tick);
  }
  function render() {
    stop();
    $("yu-cards").textContent = "";
    const q = "",
      cat = $("yu-category").value,
      list = core.presets.filter(
        (p) =>
          (cat === "All" || p.category === cat) &&
          `${p.name} ${p.category}`.toLowerCase().includes(q),
      );
    $("yu-count").textContent = list.length + " presets";
    list.forEach((p) => {
      const card = node("article", "yu-card"),
        canvas = node("canvas"),
        title = node("h2", "", p.name),
        tag = node("span", "eyebrow", p.category),
        button = node("button", "yu-customize", "Customize");
      canvas.width = 440;
      canvas.height = 440;
      canvas.setAttribute("aria-label", p.name + " preview");
      const o = defaults(p);
      draw(canvas, p, o, o.duration + o.stagger * 10);
      button.onclick = () => {
        if (!busy) open(p);
      };
      const applyButton = node(
        "button",
        "primary yu-card-apply",
        "Apply animation",
      );
      applyButton.dataset.host = "";
      applyButton.disabled = busy || !api.ready();
      applyButton.onclick = () =>
        api.action({
          action: "yuText",
          operation: "apply",
          id: p.id,
          options: o,
        });
      card.append(canvas, tag, title, button, applyButton);
      card.onmouseenter = () => play(canvas, p, o);
      card.onmouseleave = () => {
        if (activeCanvas === canvas) {
          stop();
          draw(canvas, p, o, o.duration + o.stagger * 10);
        }
      };
      button.onfocus = () => play(canvas, p, o);
      $("yu-cards").appendChild(card);
    });
    if (!list.length)
      $("yu-cards").appendChild(node("p", "", "No matching presets."));
  }
  function open(p, o, loaded) {
    stop();
    document.dispatchEvent(new Event("zxt-open-animation"));
    $("yu").classList.add("yu-inspecting");
    preset = p;
    target = loaded ? loaded.target : null;
    $("yu-apply").hidden = !!loaded;
    $("yu-update").textContent = loaded ? "Save changes" : "Update loaded FX";
    $("yu-browser").hidden = false;
    $("yu-editor").hidden = false;
    $("yu-title").textContent = p.name;
    $("yu-target").textContent = loaded
      ? "Loaded: " + loaded.layerName
      : "Select text layers in AE. Apply replaces only the chosen YU phase.";
    o = o || defaults(p);
    Object.keys(o).forEach((k) => {
      if ($("yu-" + k)) $("yu-" + k).value = o[k];
    });
    sync();
    play($("yu-preview"), p, values());
  }
  async function load() {
    const r = await api.action({
      action: "yuText",
      operation: "load",
      phase: $("yu-mode").value === "OUT" ? "OUT" : "IN",
    });
    if (r && r.id) open(core.presets[r.id - 1], r.options, r);
  }
  async function apply(update) {
    if (!valid()) return;
    const r = await api.action({
      action: "yuText",
      operation: "apply",
      id: preset.id,
      options: values(),
      target: update ? target : null,
    });
    if (r && r.changed && update) await load();
  }
  function init(adapter) {
    api = adapter;
    Object.keys(fields).forEach((k) =>
      fields[k].forEach((v) => {
        const e = node(
          "option",
          "",
          k === "order" && v === "edges" ? "Edges first" : labels[v] || v,
        );
        e.value = v;
        $("yu-" + k).appendChild(e);
      }),
    );
    ["All", ...new Set(core.presets.map((p) => p.category))].forEach((v) => {
      const e = node("option", "", v);
      e.value = v;
      $("yu-category").appendChild(e);
    });
    $("yu-category").onchange = () => { $("text-animate-group").open = true; render(); };
    $("yu-back").onclick = () => {
      stop();
      $("yu").classList.remove("yu-inspecting");
      $("yu-editor").hidden = true;
      $("yu-browser").hidden = false;
    };
    $("yu-apply").onclick = () => apply(false);
    $("yu-update").onclick = () => apply(true);
    $("yu-clear").onclick = async () => {
      const r = await api.action({ action: "yuText", operation: "clear" });
      if (r && r.changed) {
        target = null;
        sync();
      }
    };
    $("yu-replay").onclick = () => {
      if (valid()) play($("yu-preview"), preset, values());
    };
    $("yu-controls").oninput = () => {
      sync();
      if (valid()) play($("yu-preview"), preset, values());
    };
    Object.keys(defaults(preset)).forEach(
      (k) => ($("yu-" + k).value = defaults(preset)[k]),
    );
    render();
    sync();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
    });
  }
  return {
    init,
    load,
    openById(id) {
      const p = core.presets.find((p) => p.id === id);
      if (p && !busy) open(p);
    },
    setVisible(on) {
      visible = on;
      stop();
      if (on) {
        $("yu").classList.remove("yu-inspecting");
        $("yu-editor").hidden = true;
        $("yu-browser").hidden = false;
      }
    },
    setBusy(on) {
      busy = on;
      if (on) stop();
      if (api) sync();
    },
  };
})();
