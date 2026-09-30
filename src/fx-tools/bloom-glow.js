/* Bloom Glow: independent native effect recipe. */
function bloomGlow(p) {
  var id = "bloom";
  return [
    spec(
      id,
      "source tint",
      "ADBE Fill",
      { "ADBE Fill-0002": rgba(p.color) },
      null,
      p.tint
    ),
    glow(id, "core", p.radius, p.intensity, p.threshold),
    glow(id, "halo", p.radius * p.spread, p.intensity * p.falloff, p.threshold),
    glow(
      id,
      "bloom",
      p.radius * p.spread * 2,
      p.intensity * p.falloff * p.falloff,
      p.threshold
    )
  ];
}
