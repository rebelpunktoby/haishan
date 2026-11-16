# field/ — your own recordings for the environment

The page synthesizes wind, rain, water, insects, birds, a far city and a room tone so it works
with no files. Put a recording here and list it in `manifest.json`, and that element uses your
recording instead (loaded only when the element sounds, never before).

    {
      "wind":    ["field/wind_night_01.m4a", "field/wind_day_01.m4a"],
      "rain":    ["field/rain_light_01.m4a"],
      "water":   ["field/water_01.m4a"],
      "insects": ["field/insects_evening_01.m4a"],
      "birds":   ["field/birds_dawn_01.m4a"],
      "city":    ["field/city_far_01.m4a"],
      "room":    ["field/room_01.m4a"]
    }

Record to this spec and nothing else needs changing:

- **What**: one element per file, nothing else audible in it. No music, no voices, no close transients.
- **Length**: 30–60 s. Fade the first and last 1.5 s to silence in your editor so it loops without a click.
- **Format**: AAC in .m4a, 44.1 kHz, 96 kbps stereo (or 64 kbps mono for room tone). Keep the 48 kHz / 24-bit original elsewhere.
- **Loudness**: about −30 LUFS integrated, peaks under −6 dBFS. Quieter is fine; the page sets the level.
- **Weight**: under 400 KB per file, under 2 MB in this folder in all.
- **Names**: `element_quality_nn.m4a` — element from the list above, quality a word you choose (night, light, far…), nn a number.

The page filters and phrases whatever you give it (rain is resonated toward the day chord, wind gusts
with the breath), so record the plain thing: the room at night, rain on a window, the street from the
fourth floor.
