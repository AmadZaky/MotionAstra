import json,pathlib
p=pathlib.Path(__file__).resolve().parent.parent
s=json.dumps(json.loads((p/"presets.json").read_text()),indent=2)
(p/"js/presets-data.js").write_text("window.MA_PRESETS = "+s+";\n")
(p/"jsx/presets-data.jsx").write_text("var MA_PRESET_DATA = "+s+";\n")
