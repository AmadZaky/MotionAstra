# Effect reference — 2.5

Twenty public recipes. All controls are local; numeric/color/checkbox controls are exposed on the target layer. Text strings and structural Count require Update.


## Text

| Preset | Native construction | Appearance controls |
|---|---|---|
| Counter Text | Source Text expression; exact bounded interpolation and numeric formatting. | Start number, End number, Decimal places, Number format, Prefix, Suffix |
| Text Switcher | Source Text expression; 12 phrases; manual Choice or automatic progress. | Phrases · one per line, Switch mode, Choice |
| Kinetic Stretch | Text scale/opacity animator with per-character damped oscillation. | Intensity, Detail / motion frequency, Character stagger · % |
| Liquid Gold | Gradient Ramp + Turbulent Displace + animated character highlight. | Intensity, Detail / motion frequency, Primary color |
| Burning Ember | Gradient Ramp + Turbulent Displace + character opacity flicker. | Intensity, Detail / motion frequency, Primary color |
| Retro VHS | Stepped seeded text-position jitter + horizontal Gaussian Blur. | Intensity, Detail / motion frequency |
| 3D Glass | Gradient Ramp + Bevel Alpha + character color highlight (2D glass simulation). | Intensity, Primary color |
| Matrix Code | Source Text code scramble + Fill. | Primary color, Random seed, Scramble steps |
| Film Stamp | Text scale/rotation/opacity animator + decaying Gaussian Blur. | Intensity, Detail / motion frequency, Character stagger · % |
| Gold Extrusion | Gradient Ramp + Bevel Alpha + Drop Shadow depth (2D extrusion simulation). | Intensity, Primary color |

## Background

| Preset | Native construction | Appearance controls |
|---|---|---|
| Neon Grid | Animated thin rectangular solid masks + Gradient Ramp. | Primary color, Secondary color, Elements / density, Element size · px, Motion amount, Cycles across duration |
| Space Nebula | Fractal Noise evolution/contrast + Tint. | Base color, Primary color, Motion amount, Cycles across duration |
| Liquid Gradient | Moving Gradient Ramp + Turbulent Displace. | Primary color, Secondary color, Element size · px, Motion amount, Cycles across duration |
| 80s Sunburst | Rotating triangular spoke masks + Gradient Ramp. | Primary color, Secondary color, Elements / density, Element size · px, Motion amount, Cycles across duration |
| Soft Bokeh | Seeded orbiting circular masks + Gradient Ramp + Gaussian Blur. | Primary color, Secondary color, Elements / density, Element size · px, Motion amount, Cycles across duration, Softness · px, Random seed |
| Matrix Tunnel | Expanding rectangular ring masks + Gradient Ramp. | Primary color, Secondary color, Elements / density, Element size · px, Motion amount, Cycles across duration |
| Glassmorphism | Gradient Ramp + Turbulent Displace + rectangular card mask + blur/bevel/opacity. | Primary color, Secondary color, Element size · px, Motion amount, Cycles across duration, Softness · px |
| Dark Smoke | Fractal Noise evolution/contrast + dark Tint palette. | Base color, Primary color, Motion amount, Cycles across duration |
| Speedlines | Seeded radial streak masks + Gradient Ramp. | Primary color, Secondary color, Elements / density, Element size · px, Motion amount, Cycles across duration, Random seed |
| Blueprint CAD | Grid rectangle masks and annular construction masks + Gradient Ramp. | Primary color, Secondary color, Elements / density, Element size · px, Motion amount, Cycles across duration |

Text/background timing: Duration, Ease, Loop OFF, Reverse and manual Progress.

## Defaults

### Counter Text (`counter`)

| Control | Default |
|---|---|
| Start number | 0 |
| End number | 1000 |
| Decimal places | 0 |
| Number format | 0 |
| Prefix |  |
| Suffix |  |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Text Switcher (`switcher`)

| Control | Default |
|---|---|
| Phrases · one per line | CREATE / MOVE / INSPIRE |
| Switch mode | 0 |
| Choice | 1 |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Kinetic Stretch (`stretch`)

| Control | Default |
|---|---|
| Intensity | 60 |
| Detail / motion frequency | 5 |
| Character stagger · % | 45 |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Liquid Gold (`gold`)

| Control | Default |
|---|---|
| Intensity | 60 |
| Detail / motion frequency | 5 |
| Primary color | #ffd778 |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Burning Ember (`ember`)

| Control | Default |
|---|---|
| Intensity | 60 |
| Detail / motion frequency | 5 |
| Primary color | #ff713d |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Retro VHS (`vhs`)

| Control | Default |
|---|---|
| Intensity | 60 |
| Detail / motion frequency | 5 |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### 3D Glass (`glass`)

| Control | Default |
|---|---|
| Intensity | 60 |
| Primary color | #b7deff |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Matrix Code (`matrix`)

| Control | Default |
|---|---|
| Primary color | #55f69a |
| Random seed | 7 |
| Scramble steps | 24 |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Film Stamp (`stamp`)

| Control | Default |
|---|---|
| Intensity | 60 |
| Detail / motion frequency | 5 |
| Character stagger · % | 45 |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Gold Extrusion (`extrusion`)

| Control | Default |
|---|---|
| Intensity | 60 |
| Primary color | #ffd778 |
| Duration · seconds | 2 |
| Easing | 2 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Neon Grid (`neongrid`)

| Control | Default |
|---|---|
| Primary color | #198deb |
| Secondary color | #b277ff |
| Elements / density | 16 |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Space Nebula (`nebula`)

| Control | Default |
|---|---|
| Base color | #071520 |
| Primary color | #198deb |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Liquid Gradient (`liquidgradient`)

| Control | Default |
|---|---|
| Primary color | #198deb |
| Secondary color | #b277ff |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### 80s Sunburst (`retrosun`)

| Control | Default |
|---|---|
| Primary color | #ff9650 |
| Secondary color | #ed3894 |
| Elements / density | 16 |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Soft Bokeh (`softbokeh`)

| Control | Default |
|---|---|
| Primary color | #198deb |
| Secondary color | #b277ff |
| Elements / density | 16 |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Softness · px | 25 |
| Random seed | 7 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Matrix Tunnel (`tunnel`)

| Control | Default |
|---|---|
| Primary color | #36f08f |
| Secondary color | #b277ff |
| Elements / density | 16 |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Glassmorphism (`glassbg`)

| Control | Default |
|---|---|
| Primary color | #198deb |
| Secondary color | #b277ff |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Softness · px | 25 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Dark Smoke (`smoke`)

| Control | Default |
|---|---|
| Base color | #071520 |
| Primary color | #737c89 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Speedlines (`speedbg`)

| Control | Default |
|---|---|
| Primary color | #198deb |
| Secondary color | #b277ff |
| Elements / density | 16 |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Random seed | 7 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
### Blueprint CAD (`blueprint`)

| Control | Default |
|---|---|
| Primary color | #198deb |
| Secondary color | #b277ff |
| Elements / density | 16 |
| Element size · px | 50 |
| Motion amount | 40 |
| Cycles across duration | 1 |
| Duration · seconds | 5 |
| Easing | 0 |
| Loop animation | False |
| Reverse playback | False |
| Use progress slider | False |
| Progress · % | 0 |
