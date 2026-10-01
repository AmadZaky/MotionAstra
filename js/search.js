/* Cross-panel search navigates to controls; it never runs a host mutation. */
window.MotionAstraSearch = (() => {
  const $ = (id) => document.getElementById(id);
  let api,
    items = [];
  function close() {
    $("global-search").hidden = true;
    $("toggle-search").setAttribute("aria-expanded", "false");
  }
  function render() {
    const q = $("search").value.trim().toLocaleLowerCase(),
      box = $("search-results");
    box.textContent = "";
    if (!q) {
      $("search-count").textContent =
        "Find text FX, animations, SolidGen and tools.";
      return;
    }
    const matches = items.filter((x) =>
      (x.name + " " + x.group + " " + x.keywords)
        .toLocaleLowerCase()
        .includes(q),
    );
    $("search-count").textContent = matches.length + " results";
    matches.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.name + " · " + item.group;
      button.onclick = () => {
        if (api.busy()) return;
        close();
        item.open();
      };
      box.appendChild(button);
    });
  }
  function init(adapter) {
    api = adapter;
    window.MA_PRESETS.presets.forEach((p) =>
      items.push({
        name: p.name,
        group: p.category === "Text" ? "Text Tools FX" : "SolidGen",
        keywords: p.description,
        open() {
          api.tab(p.category === "Text" ? "YU" : "Background");
          api.open(p);
        },
      }),
    );
    window.YTMCore.presets.forEach((p) =>
      items.push({
        name: p.name,
        group: "Text Animate",
        keywords: p.category,
        open() {
          api.tab("YU");
          window.MotionAstraYUUI.openById(p.id);
        },
      }),
    );
    [
      ["tools", "Tools", "Quick Tools"],
      ["create", "Create", "Create"],
      ["motion-curve", "Curve", "Motion Curve"],
      ["settings", "Settings", "Settings"],
    ].forEach(([id, tab, group]) => {
      items.push({
        name: group,
        group: "Workspace",
        keywords: "",
        open() {
          api.tab(tab);
        },
      });
      document
        .querySelectorAll("#" + id + " button,#" + id + " label")
        .forEach((node) => {
          const name = (node.getAttribute("aria-label") || node.textContent)
            .trim()
            .replace(/\s+/g, " ");
          if (!name || name.length > 100) return;
          const detail = node.closest("details");
          items.push({
            name,
            group,
            keywords: detail ? detail.querySelector("summary").textContent : "",
            open() {
              api.tab(tab);
              let parent = node.parentElement;
              while (parent) {
                if (parent.tagName === "DETAILS") parent.open = true;
                parent = parent.parentElement;
              }
              node.scrollIntoView({ block: "center" });
              const control = node.matches("label")
                ? node.querySelector("input,select,textarea")
                : node;
              if (control) control.focus();
            },
          });
        });
    });
    $("search").oninput = render;
    $("toggle-search").onclick = () => {
      const open = $("global-search").hidden || $("nav").hidden;
      $("global-search").hidden = !open;
      $("toggle-search").setAttribute("aria-expanded", String(open));
      if (open) {
        $("nav").hidden = false;
        $("fold-nav").setAttribute("aria-expanded", "true");
        $("fold-nav").textContent = "Menu ▴";
        render();
        $("search").focus();
      }
    };
    $("search").onkeydown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        $("toggle-search").focus();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const first = $("search-results").querySelector("button");
        if (first) first.focus();
      }
    };
    $("global-search").addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        close();
        $("toggle-search").focus();
      }
    });
  }
  return { init };
})();
