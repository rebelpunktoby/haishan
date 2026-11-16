# /rnbo/ — the OceanMountain sound system, Max → RNBO

The renderer is being rebuilt here module by module, to replace the Web Audio
engine on /circadian/ once it sounds right. The brain (hour, 節氣, sun, breath
knobs) stays in the web shell; this is the sound. Governed by the Realization
Interface Contract v0.1.1 — everything here is renderer latitude (Ledger L15);
every gated question keeps its named empty slot.

## R1 — what's here

- **om_core.maxpat** — open in Max 9. Start audio (ezdac). You hear the seam,
  the breath and the voice: six partials with slow drift under a soft top that
  follows Light, a sub body, three copies a few cents apart, hour boundaries as
  bell shoulders (never steps), one uneven breath phrasing level and
  brightness, and the safety chain (9 kHz ceiling, slow limiter, soft guard).
- **om_core.genexpr** — the same DSP as text. It is written in GenExpr, the
  dialect Max gen~ and RNBO codebox share: the RNBO port is a paste into a
  codebox inside rnbo~, params become RNBO params, nothing is rewritten.

Try: the day-sweep toggle plays the whole 24 hours in 4 minutes. 午 winter sits
near 246 Hz; the night near 110/55. Record a take (open → toggle) and send it
back with the hourF/month you used.

Checked numerically before commit: peaks −5.9 to −7.2 dBFS at the loudest
settings, no NaN, no steps, carrier lands on the table's pitches.

## The seam (params the shell will send)

hourF · month · lightk · breathk · drive · level · seed
(R2 adds: jieqi, riseH, setH, sunAlt, room, speakers, weather.*)

## R2 plan

om.body (modal bank, grown from OM_L3_7A's reson~ bank) → om.room (gen~ FDN
following the sun) → om.texture (answer by counterpoint, air) → om.place
(granular players for /circadian/field/ recordings) → characters as presets.
