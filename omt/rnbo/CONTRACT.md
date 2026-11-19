# OMT · one instrument, two drivers

One RNBO patch makes the sound. Two drivers play it by writing the same named parameters:

- **Motion 身境** — the body (camera, touch or phone tilt), at `/omt/motion/`
- **Engine 聲境** — the clock and the sky (hour, solar term, sunrise, breath), at `/circadian/`

The patch never knows which driver is playing. Sound designed for one is heard in the other.

Status: **Motion is wired** (site switch `?engine=rnbo`, and MIDI to Max). **Engine is mapped on paper only** (the column below is a proposal, not built).

## Parameters (RNBO `param` names)

All 0–1 unless noted. Drivers send raw values about 30 times a second; **the patch does its own smoothing** (so the feel is designed in Max, not in the page).

| # | name | range | what it means | Motion driver | Engine driver (proposal) | MIDI CC (ch 1) |
|---|---|---|---|---|---|---|
| 1 | `energy` | 0–1 | how much is happening now — loudness, density | body energy `S.body` (follow ×1.6 + storm ×0.8) | daylight × breath inhale | 37 |
| 2 | `follow` | 0–1 | the body almost as it happens (0.15 s in, 0.6 s out) | `S.fol` | breath envelope | 36 |
| 3 | `form` | 0–1 | the slow arc of a phrase (1.5 s in, 1–5 s out) | `S.mot` | position in the day (0 midnight → 1 noon) | 20 |
| 4 | `still` | 0–1 | how deep the stillness is | still time ÷ 8 s | night depth, the rests between breaths | 24 |
| 5 | `height` | 0–1 | low ↔ high, dark ↔ bright | `S.hi` (her height / phone tilt) | Light dial | 22 |
| 6 | `pan` | −1–1 | left ↔ right | `S.pan` | the sun's side of the sky | 23 |
| 7 | `storm` | 0–1 | the wild layer | `S.storm` | 0 (no weather yet) | 25 |
| 8 | `edge` | 0–1 | weirdness, drive | Edge level | 0 | 35 |
| 9 | `room` | 0–1 | how large the space | Space level | Room dial | 39 |
| 10 | `pulse` | 4–200 bpm | the grid strikes and storm lock to | 40 + pulse × 100 | 60 ÷ breath period | 40 (40–140) |
| 11 | `root` | 20–880 Hz | the ground tone | A4 ÷ 8 (A1, follows piano tuning) | day chord root × season octave | 42 (A4 420–460) |
| 12 | `ground` | 0–1 | world 土 | on ÷ √(worlds on) | 長夏 / the turning seasons | 27 bit 0 |
| 13 | `water` | 0–1 | world 水 | 〃 | winter | 27 bit 1 |
| 14 | `fire` | 0–1 | world 火 | 〃 | summer | 27 bit 2 |
| 15 | `wind` | 0–1 | world 風 | 〃 | spring / autumn | 27 bit 3 |
| 16 | `level` | 0–1 | master — the driver's release and fade | Release fade | the page's fade in / out | 41 |
| 17 | `hit` | counter | every change = one strike | +1 on a sudden move | +1 on each 時辰 change | note on ch 3 |
| 18 | `hitamt` | 0–1 | strength of the next strike | strike amount | 0.5 | velocity ÷ 127 |

Ladders (partials over `root`) are the same as the site's worlds:

- 土 `1 2 3 4 6 5 7 9 11 13`
- 水 `2 3 4 6 5 10 9 7 14 11`
- 火 `4 6 7 9 11 13 14 15 17 19`
- 風 `16 24 32 40 28 36 44 52`

## Rules for the patch

1. Output is **stereo**, `out~ 1` and `out~ 2`. Keep peaks under −3 dBFS; the site adds a hall, the pulse-locked glitch and a safety limiter after it.
2. Silent at `level 0`. Nothing should click when any parameter jumps.
3. **Space:** on the site, `room` already drives the hall, so a reverb inside the patch is optional there. For the Mac live set, build the space in the patch or in Max after `rnbo~`.
4. Add new parameters freely; the drivers ignore names they don't know, and the patch should give unknown inputs a sensible default.

## Export to the site

1. In the patch, open the `rnbo~` window → **Export Sidebar** → **Web Export**.
2. Output directory: this repo's `omt/rnbo/export/`. File name: `patch.export.json`. Leave "copy library" off.
3. Commit and push. Open `oceanmountainlai.art/omt/motion/?engine=rnbo`. The page loads the matching RNBO library for the version you exported with; if anything fails it says so and plays the built-in engine.

## Drive Max from the page (Mac live)

1. Audio MIDI Setup → MIDI Studio → IAC Driver → **Device is online**.
2. Chrome: `oceanmountainlai.art/omt/motion/?midi=1` → Start. The page picks the IAC bus by itself and sends the CCs above.
3. Open `src/omt-instrument.maxpat`. The harness turns the CCs into parameters for `rnbo~`.

If the patch file won't open in your Max version: make a new patcher, add `rnbo~`, and inside it add one `codebox~`. Paste in `src/omt-voice.codebox.js`, which declares all the parameters itself with `@param`. Then connect its two outlets to `out~ 1` and `out~ 2`. The harness patch is only plumbing, so you can rebuild it from the table above.

7-bit CC is coarse (128 steps). Fine for designing; the web export gets full-resolution values.
