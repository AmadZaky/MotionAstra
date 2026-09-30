/* Glass Surface: a self-contained native surface treatment.
 * Uses the selected layer's pixels/alpha. It does not sample layers behind it.
 * No precompositions, helper layers or source replacement are required.
 */
function glassSurface(p) {
  var id = "glass";
  var start =
    expressionPrefix + "var r=sourceRectAtTime(time,false);[r.left,r.top];";
  var end =
    expressionPrefix +
    "var r=sourceRectAtTime(time,false);[r.left+r.width,r.top+r.height];";
  return [
    spec(
      id,
      "tint",
      "ADBE Ramp",
      {
        "ADBE Ramp-0002": rgba(p.color),
        "ADBE Ramp-0004": [1, 1, 1, 1],
        "ADBE Ramp-0005": 1,
        "ADBE Ramp-0006": 10,
        "ADBE Ramp-0007": 100 - p.tint
      },
      { "ADBE Ramp-0001": start, "ADBE Ramp-0003": end },
      p.tint > 0
    ),
    spec(
      id,
      "surface distortion",
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
      "frost",
      "ADBE Gaussian Blur 2",
      {
        "ADBE Gaussian Blur 2-0001": p.blur,
        "ADBE Gaussian Blur 2-0002": 1,
        "ADBE Gaussian Blur 2-0003": 1
      },
      null,
      p.blur > 0
    ),
    spec(
      id,
      "rim light",
      "ADBE Bevel Alpha",
      {
        "ADBE Bevel Alpha-0001": p.edge,
        "ADBE Bevel Alpha-0002": p.angle,
        "ADBE Bevel Alpha-0003": rgba(p.lightColor),
        "ADBE Bevel Alpha-0004": p.light
      },
      null,
      p.edge > 0 && p.light > 0
    ),
    glow(id, "bloom", p.radius, p.glow, 65)
  ];
}
