{
 "patcher": {
  "fileversion": 1,
  "appversion": {
   "major": 9,
   "minor": 1,
   "revision": 4,
   "architecture": "x64",
   "modernui": 1
  },
  "classnamespace": "box",
  "rect": [
   80,
   60,
   1000,
   700
  ],
  "autosave": 0,
  "boxes": [
   {
    "box": {
     "id": "obj-1",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      30,
      20,
      640,
      33
     ],
     "text": "\u5c71\u6d77 OceanMountain \u2014 RNBO base R1: seam \u00b7 breath \u00b7 voice \u00b7 safety.  Start audio (ezdac), then listen.  The DSP lives in gen~ codebox (om_core.genexpr) and ports to RNBO codebox as-is.",
     "presentation": 0,
     "fontsize": 12
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      420,
      420,
      180,
      22
     ],
     "outlettype": [
      "signal",
      "signal"
     ],
     "text": "gen~ @title om_core",
     "patcher": {
      "fileversion": 1,
      "appversion": {
       "major": 9,
       "minor": 1,
       "revision": 4,
       "architecture": "x64",
       "modernui": 1
      },
      "classnamespace": "dsp.gen",
      "rect": [
       60,
       80,
       900,
       640
      ],
      "boxes": [
       {
        "box": {
         "id": "obj-1",
         "maxclass": "codebox",
         "numinlets": 0,
         "numoutlets": 2,
         "outlettype": [
          "",
          ""
         ],
         "patching_rect": [
          40,
          40,
          760,
          480
         ],
         "code": "// om_core.genexpr \u2014 OceanMountain RNBO base \u00b7 R1: seam, breath, voice, safety\n// GenExpr shared by Max gen~ today and RNBO codebox later: the web export is a paste, not a rewrite.\n// The hour table is the truth, copied verbatim. Register: mappings here marked R3 are design choices.\n\nParam hourF(12.5, min=0, max=24);     // true-solar decimal hour, from the shell (R1 measured input)\nParam month(1, min=1, max=12);        // season month (the shell sends the \u7bc0\u6c23 quarter in \u6642\u8fb0 mode)\nParam lightk(50, min=0, max=100);     // Light knob\nParam breathk(10, min=4, max=20);     // Breath knob; 10 is neutral\nParam drive(1, min=0.5, max=2);       // lead warmth\nParam level(0.8, min=0, max=1);       // output trim\nParam seed(11, min=1, max=9999);\n\nData tbl(24);                          // carriers, Hz\nData ph(32);                           // phase accumulators: 3 copies \u00d7 6 partials, + 3 subs\nHistory inited(0);\nHistory bphase(0);                     // the breath, 0..1\nHistory bper(10);                      // this breath's seconds\nHistory rngst(11);\nHistory slowph(0);                     // slow drift clock (~73 s)\nHistory env(0);                        // limiter envelope\nHistory lp1(0), lp2(0), lp1b(0), lp2b(0);\n\nif (inited == 0) {\n  poke(tbl, 110, 0); poke(tbl, 110, 1); poke(tbl, 165, 2); poke(tbl, 165, 3);\n  poke(tbl, 110, 4); poke(tbl, 220, 5); poke(tbl, 220, 6); poke(tbl, 275, 7);\n  poke(tbl, 330, 8); poke(tbl, 330, 9); poke(tbl, 275, 10); poke(tbl, 440, 11);\n  poke(tbl, 440, 12); poke(tbl, 550, 13); poke(tbl, 550, 14); poke(tbl, 440, 15);\n  poke(tbl, 440, 16); poke(tbl, 165, 17); poke(tbl, 165, 18); poke(tbl, 110, 19);\n  poke(tbl, 110, 20); poke(tbl, 165, 21); poke(tbl, 110, 22); poke(tbl, 110, 23);\n  rngst = seed;\n  inited = 1;\n}\n\n// ---- season octave (R3 convention carried from the engine) ----\noct = ((month < 3) || (month > 11)) ? 0.5 : (((month > 5) && (month < 9)) ? 2 : 1);\n\n// ---- the hour with bell shoulders: a boundary is a lean, never an event (VII.4) ----\nh0 = floor(hourF); frac = hourF - h0;\nh1 = h0 + 1; if (h1 > 23) h1 = 0;\nw = frac * frac * (3 - 2 * frac);\nfc = exp(mix(log(peek(tbl, h0)), log(peek(tbl, h1)), w)) * oct;\n\n// ---- one breath: uneven, never a metronome (R3) ----\nnoonness = 0.5 + 0.5 * cos((hourF - 13) / 24 * twopi);\nbaseper = (9 + 7 * (1 - noonness)) * (breathk / 10);\nbphase += 1 / (bper * samplerate);\nif (bphase >= 1) {\n  bphase -= 1;\n  rngst = wrap(rngst * 16807, 1, 2147483647);              // Park\u2013Miller; stays inside double precision\n  bper = baseper * (0.92 + 0.16 * (rngst / 2147483647));\n}\nbp = bphase;\nt1 = min(bp / 0.38, 1); t1 = t1 * t1 * (3 - 2 * t1);        // inhale\nt2 = max((bp - 0.46) / 0.54, 0); t2 = t2 * t2 * (3 - 2 * t2); // exhale\namp_b   = mix(mix(0.78, 1.0, t1), 0.80, t2);\nbright_b = mix(mix(0.85, 1.25, t1), 0.90, t2);\n\n// ---- the lead: six partials with slow drift under a soft top, a sub; three copies a few cents apart ----\ntopf = min(900 + fc * (3.5 + 3.5 * lightk / 100) * bright_b, 6500);\nslowph += 1 / (73 * samplerate); if (slowph >= 1) slowph -= 1;\nsumL = 0; sumR = 0;\nfor (u = 0; u < 3; u += 1) {\n  det = (u - 1) * 0.003 + 0.0008 * sin(twopi * slowph * (2 + u));   // \u00b15 cents apart, wandering \u00b11.4\n  f0 = fc * (1 + det);\n  panL = (u == 0) ? 0.85 : ((u == 1) ? 0.6 : 0.3);\n  panR = (u == 0) ? 0.3  : ((u == 1) ? 0.6 : 0.85);\n  v = 0;\n  for (k = 1; k < 7; k += 1) {\n    idx = u * 6 + (k - 1);\n    pf = f0 * k * (1 + 0.0015 * sin(twopi * (slowph * (3 + idx) + idx * 0.37)));\n    p = wrap(peek(ph, idx) + pf / samplerate, 0, 1); poke(ph, p, idx);\n    a = pow(k, -1.35) / (1 + pow(f0 * k / topf, 6));                 // soft spectral ceiling, not a cliff\n    v += a * sin(twopi * p);\n  }\n  si = 18 + u;\n  sp = wrap(peek(ph, si) + (f0 * 0.5) / samplerate, 0, 1); poke(ph, sp, si);\n  v += 0.34 * sin(twopi * sp);                                        // the body under the carrier\n  sumL += v * panL; sumR += v * panR;\n}\ng = 0.22 * amp_b * level;\nxl = sumL * g; xr = sumR * g;\n\n// ---- warmth: gentle, mostly even harmonics, level-compensated (R3) ----\nd = drive * 1.15; cmp = 0.82 * pow(1.15 / max(d, 0.8), 0.6); bias = 0.22;\nxl = (tanh(xl * d + bias) - tanh(bias)) * cmp;\nxr = (tanh(xr * d + bias) - tanh(bias)) * cmp;\n\n// ---- safety: ~9 kHz ceiling, a slow limiter, a soft guard. Never removed. ----\ncf = exp(-twopi * 9000 / samplerate);\nlp1 = cf * lp1 + (1 - cf) * xl;  lp2 = cf * lp2 + (1 - cf) * lp1;  xl = lp2;\nlp1b = cf * lp1b + (1 - cf) * xr; lp2b = cf * lp2b + (1 - cf) * lp1b; xr = lp2b;\nenv = max(max(abs(xl), abs(xr)), env * 0.9997);\ngr = (env > 0.5) ? 0.5 / env : 1;\nout1 = tanh(xl * gr * 1.15) * 0.98;\nout2 = tanh(xr * gr * 1.15) * 0.98;\n"
        }
       },
       {
        "box": {
         "id": "obj-2",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          40,
          560,
          50,
          22
         ],
         "text": "out 1"
        }
       },
       {
        "box": {
         "id": "obj-3",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          120,
          560,
          50,
          22
         ],
         "text": "out 2"
        }
       }
      ],
      "lines": [
       {
        "patchline": {
         "source": [
          "obj-1",
          0
         ],
         "destination": [
          "obj-2",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "obj-1",
          1
         ],
         "destination": [
          "obj-3",
          0
         ]
        }
       }
      ]
     }
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      30,
      70,
      120,
      20
     ],
     "text": "hourF (true sun)"
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      30,
      95,
      110,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "loadmess 12.5"
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      30,
      125,
      70,
      22
     ],
     "outlettype": [
      "float",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      30,
      155,
      120,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "hourF $1"
    }
   },
   {
    "box": {
     "id": "obj-7",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      170,
      70,
      120,
      20
     ],
     "text": "month (1\u201312)"
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      170,
      95,
      110,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "loadmess 1"
    }
   },
   {
    "box": {
     "id": "obj-9",
     "maxclass": "number",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      170,
      125,
      70,
      22
     ],
     "outlettype": [
      "",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      170,
      155,
      120,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "month $1"
    }
   },
   {
    "box": {
     "id": "obj-11",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      310,
      70,
      120,
      20
     ],
     "text": "Light 0\u2013100"
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      310,
      95,
      110,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "loadmess 50"
    }
   },
   {
    "box": {
     "id": "obj-13",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      310,
      125,
      70,
      22
     ],
     "outlettype": [
      "float",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-14",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      310,
      155,
      120,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "lightk $1"
    }
   },
   {
    "box": {
     "id": "obj-15",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      450,
      70,
      120,
      20
     ],
     "text": "Breath 4\u201320 s"
    }
   },
   {
    "box": {
     "id": "obj-16",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      450,
      95,
      110,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "loadmess 10"
    }
   },
   {
    "box": {
     "id": "obj-17",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      450,
      125,
      70,
      22
     ],
     "outlettype": [
      "float",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-18",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      450,
      155,
      120,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "breathk $1"
    }
   },
   {
    "box": {
     "id": "obj-19",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      590,
      70,
      120,
      20
     ],
     "text": "drive 0.5\u20132"
    }
   },
   {
    "box": {
     "id": "obj-20",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      590,
      95,
      110,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "loadmess 1.0"
    }
   },
   {
    "box": {
     "id": "obj-21",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      590,
      125,
      70,
      22
     ],
     "outlettype": [
      "float",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-22",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      590,
      155,
      120,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "drive $1"
    }
   },
   {
    "box": {
     "id": "obj-23",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      730,
      70,
      120,
      20
     ],
     "text": "level 0\u20131"
    }
   },
   {
    "box": {
     "id": "obj-24",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      730,
      95,
      110,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "loadmess 0.8"
    }
   },
   {
    "box": {
     "id": "obj-25",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      730,
      125,
      70,
      22
     ],
     "outlettype": [
      "float",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-26",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      730,
      155,
      120,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "level $1"
    }
   },
   {
    "box": {
     "id": "obj-27",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      30,
      210,
      220,
      20
     ],
     "text": "sweep the whole day (4 min)"
    }
   },
   {
    "box": {
     "id": "obj-28",
     "maxclass": "toggle",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      30,
      235,
      24,
      24
     ],
     "outlettype": [
      "int"
     ]
    }
   },
   {
    "box": {
     "id": "obj-29",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      70,
      235,
      80,
      22
     ],
     "outlettype": [
      "bang"
     ],
     "text": "metro 100"
    }
   },
   {
    "box": {
     "id": "obj-30",
     "maxclass": "newobj",
     "numinlets": 5,
     "numoutlets": 4,
     "patching_rect": [
      160,
      235,
      120,
      22
     ],
     "outlettype": [
      "int",
      "",
      "",
      "int"
     ],
     "text": "counter 0 0 2399"
    }
   },
   {
    "box": {
     "id": "obj-31",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      290,
      235,
      100,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "expr $i1*0.01"
    }
   },
   {
    "box": {
     "id": "obj-32",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      420,
      470,
      60,
      22
     ],
     "outlettype": [
      "signal"
     ],
     "text": "*~ 0.9"
    }
   },
   {
    "box": {
     "id": "obj-33",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      520,
      470,
      60,
      22
     ],
     "outlettype": [
      "signal"
     ],
     "text": "*~ 0.9"
    }
   },
   {
    "box": {
     "id": "obj-34",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 0,
     "patching_rect": [
      420,
      560,
      60,
      40
     ],
     "text": "ezdac~"
    }
   },
   {
    "box": {
     "id": "obj-35",
     "maxclass": "meter~",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      620,
      470,
      20,
      80
     ],
     "outlettype": [
      "float"
     ]
    }
   },
   {
    "box": {
     "id": "obj-36",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      680,
      440,
      260,
      20
     ],
     "text": "record a take \u2192 open, then toggle"
    }
   },
   {
    "box": {
     "id": "obj-37",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      680,
      465,
      110,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "open om_take.aif"
    }
   },
   {
    "box": {
     "id": "obj-38",
     "maxclass": "toggle",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      800,
      465,
      24,
      24
     ],
     "outlettype": [
      "int"
     ]
    }
   },
   {
    "box": {
     "id": "obj-39",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 0,
     "patching_rect": [
      680,
      520,
      100,
      22
     ],
     "text": "sfrecord~ 2"
    }
   },
   {
    "box": {
     "id": "obj-40",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      30,
      300,
      900,
      100
     ],
     "text": "Breath: one uneven cycle (night ~16 s, day ~9 s x Breath knob) phrases level and brightness. Voice: six partials with slow drift under a soft top that follows Light, a sub-octave body, three copies a few cents apart. Hour boundaries are bell shoulders, not steps. Safety: 9 kHz ceiling, slow limiter, soft guard - always last. R2 adds: om.body (modal bank, from your OM_L3_7A reson~ bank), om.room (FDN), texture, place.",
     "fontsize": 11
    }
   }
  ],
  "lines": [
   {
    "patchline": {
     "source": [
      "obj-4",
      0
     ],
     "destination": [
      "obj-5",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-5",
      0
     ],
     "destination": [
      "obj-6",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-6",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
      0
     ],
     "destination": [
      "obj-9",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      0
     ],
     "destination": [
      "obj-10",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-10",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-12",
      0
     ],
     "destination": [
      "obj-13",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-13",
      0
     ],
     "destination": [
      "obj-14",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-16",
      0
     ],
     "destination": [
      "obj-17",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-17",
      0
     ],
     "destination": [
      "obj-18",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-18",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-20",
      0
     ],
     "destination": [
      "obj-21",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-21",
      0
     ],
     "destination": [
      "obj-22",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-22",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-24",
      0
     ],
     "destination": [
      "obj-25",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-25",
      0
     ],
     "destination": [
      "obj-26",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-26",
      0
     ],
     "destination": [
      "obj-2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-28",
      0
     ],
     "destination": [
      "obj-29",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-29",
      0
     ],
     "destination": [
      "obj-30",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-30",
      0
     ],
     "destination": [
      "obj-31",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-31",
      0
     ],
     "destination": [
      "obj-5",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      0
     ],
     "destination": [
      "obj-32",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-2",
      1
     ],
     "destination": [
      "obj-33",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-32",
      0
     ],
     "destination": [
      "obj-34",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-33",
      0
     ],
     "destination": [
      "obj-34",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-32",
      0
     ],
     "destination": [
      "obj-35",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-37",
      0
     ],
     "destination": [
      "obj-39",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-38",
      0
     ],
     "destination": [
      "obj-39",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-32",
      0
     ],
     "destination": [
      "obj-39",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-33",
      0
     ],
     "destination": [
      "obj-39",
      1
     ]
    }
   }
  ]
 }
}