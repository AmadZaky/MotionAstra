/* Prism Gradient: independent native effect recipe. */
function prismGradient(p) {
  var id = "prism";
  function point(end) {
    return (
      expressionPrefix +
      "var r=sourceRectAtTime(time,false);var w=Math.max(1,r.width),h=Math.max(1,r.height);var cx=r.left+w*" +
      p.centerX / 100 +
      ",cy=r.top+h*" +
      p.centerY / 100 +
      ";var a=(" +
      p.angle +
      (p.animate ? "+Math.max(0,time-inPoint)*360/" + p.duration : "") +
      ")*Math.PI/180;var d=Math.max(w,h)*" +
      p.spread / 200 +
      ";" +
      (p.radial && p.animate
        ? "cx+=w*.15*Math.cos(a);cy+=h*.15*Math.sin(a);"
        : "") +
      (p.radial && !end
        ? "[cx,cy];"
        : "[cx" +
          (end ? "+" : "-") +
          "Math.cos(a)*d,cy" +
          (end ? "+" : "-") +
          "Math.sin(a)*d];")
    );
  }
  return [
    spec(
      id,
      "gradient",
      "ADBE Ramp",
      {
        "ADBE Ramp-0002": rgba(p.colorA),
        "ADBE Ramp-0004": rgba(p.colorB),
        "ADBE Ramp-0005": p.radial ? 2 : 1,
        "ADBE Ramp-0006": 10,
        "ADBE Ramp-0007": percent(p.blend)
      },
      { "ADBE Ramp-0001": point(false), "ADBE Ramp-0003": point(true) }
    ),
    spec(
      id,
      "organic distortion",
      "ADBE Turbulent Displace",
      {
        "ADBE Turbulent Displace-0002": p.distortion,
        "ADBE Turbulent Displace-0003": p.size
      },
      null,
      p.distortion > 0
    ),
    spec(
      id,
      "diffusion",
      "ADBE Gaussian Blur 2",
      {
        "ADBE Gaussian Blur 2-0001": p.diffusion,
        "ADBE Gaussian Blur 2-0002": 1,
        "ADBE Gaussian Blur 2-0003": 1
      },
      null,
      p.diffusion > 0
    ),
    glow(id, "glow", p.radius, p.glow, 35)
  ];
}
