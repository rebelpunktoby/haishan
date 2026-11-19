{
 "patcher": {
  "fileversion": 1,
  "appversion": {
   "major": 8,
   "minor": 6,
   "revision": 0,
   "architecture": "x64",
   "modernui": 1
  },
  "classnamespace": "box",
  "rect": [
   60,
   60,
   980,
   640
  ],
  "gridsize": [
   15,
   15
  ],
  "boxes": [
   {
    "box": {
     "id": "title",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      20,
      15,
      900,
      34
     ],
     "text": "OMT instrument · harness — the Motion page (Chrome, ?midi=1, IAC Driver) plays rnbo~. Turn on audio with the speaker. Double-click rnbo~ to design. Export: see omt/rnbo/CONTRACT.md",
     "linecount": 2
    }
   },
   {
    "box": {
     "id": "c0",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      20,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 37 1"
    }
   },
   {
    "box": {
     "id": "s0",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      20,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q0",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      20,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend energy"
    }
   },
   {
    "box": {
     "id": "c1",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      102,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 36 1"
    }
   },
   {
    "box": {
     "id": "s1",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      102,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q1",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      102,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend follow"
    }
   },
   {
    "box": {
     "id": "c2",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      184,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 20 1"
    }
   },
   {
    "box": {
     "id": "s2",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      184,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q2",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      184,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend form"
    }
   },
   {
    "box": {
     "id": "c3",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      266,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 24 1"
    }
   },
   {
    "box": {
     "id": "s3",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      266,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q3",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      266,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend still"
    }
   },
   {
    "box": {
     "id": "c4",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      348,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 22 1"
    }
   },
   {
    "box": {
     "id": "s4",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      348,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q4",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      348,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend height"
    }
   },
   {
    "box": {
     "id": "c5",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      430,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 23 1"
    }
   },
   {
    "box": {
     "id": "s5",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      430,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 -1.0 1.0"
    }
   },
   {
    "box": {
     "id": "q5",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      430,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend pan"
    }
   },
   {
    "box": {
     "id": "c6",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      512,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 25 1"
    }
   },
   {
    "box": {
     "id": "s6",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      512,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q6",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      512,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend storm"
    }
   },
   {
    "box": {
     "id": "c7",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      594,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 35 1"
    }
   },
   {
    "box": {
     "id": "s7",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      594,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q7",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      594,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend edge"
    }
   },
   {
    "box": {
     "id": "c8",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      676,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 39 1"
    }
   },
   {
    "box": {
     "id": "s8",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      676,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q8",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      676,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend room"
    }
   },
   {
    "box": {
     "id": "c9",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      758,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 40 1"
    }
   },
   {
    "box": {
     "id": "s9",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      758,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 40.0 140.0"
    }
   },
   {
    "box": {
     "id": "q9",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      758,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend pulse"
    }
   },
   {
    "box": {
     "id": "c10",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      840,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 41 1"
    }
   },
   {
    "box": {
     "id": "s10",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      840,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 0.0 1.0"
    }
   },
   {
    "box": {
     "id": "q10",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      840,
      130,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend level"
    }
   },
   {
    "box": {
     "id": "cr",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      922,
      70,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 42 1"
    }
   },
   {
    "box": {
     "id": "sr",
     "maxclass": "newobj",
     "numinlets": 6,
     "numoutlets": 1,
     "patching_rect": [
      922,
      100,
      76,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "scale 0 127 420. 460."
    }
   },
   {
    "box": {
     "id": "dr",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      922,
      130,
      40,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "/ 8."
    }
   },
   {
    "box": {
     "id": "qr",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      922,
      160,
      80,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend root"
    }
   },
   {
    "box": {
     "id": "cw",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      20,
      210,
      76,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "ctlin 27 1"
    }
   },
   {
    "box": {
     "id": "tw",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 5,
     "patching_rect": [
      20,
      240,
      140,
      22
     ],
     "outlettype": [
      "",
      "",
      "",
      "",
      ""
     ],
     "text": "t i i i i i"
    }
   },
   {
    "box": {
     "id": "nw",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      180,
      240,
      420,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "expr 1./sqrt(max(1, (($i1>>0)&1)+(($i1>>1)&1)+(($i1>>2)&1)+(($i1>>3)&1)))"
    }
   },
   {
    "box": {
     "id": "bw0",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      20,
      300,
      130,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "expr (($i1>>0)&1)*$f2"
    }
   },
   {
    "box": {
     "id": "qw0",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      20,
      330,
      100,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend ground"
    }
   },
   {
    "box": {
     "id": "bw1",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      170,
      300,
      130,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "expr (($i1>>1)&1)*$f2"
    }
   },
   {
    "box": {
     "id": "qw1",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      170,
      330,
      100,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend water"
    }
   },
   {
    "box": {
     "id": "bw2",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      320,
      300,
      130,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "expr (($i1>>2)&1)*$f2"
    }
   },
   {
    "box": {
     "id": "qw2",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      320,
      330,
      100,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend fire"
    }
   },
   {
    "box": {
     "id": "bw3",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      470,
      300,
      130,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "expr (($i1>>3)&1)*$f2"
    }
   },
   {
    "box": {
     "id": "qw3",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      470,
      330,
      100,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend wind"
    }
   },
   {
    "box": {
     "id": "ni",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      660,
      210,
      70,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "notein 3"
    }
   },
   {
    "box": {
     "id": "sv",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 2,
     "patching_rect": [
      700,
      240,
      50,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "sel 0"
    }
   },
   {
    "box": {
     "id": "tv",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      700,
      270,
      50,
      22
     ],
     "outlettype": [
      "",
      ""
     ],
     "text": "t b f"
    }
   },
   {
    "box": {
     "id": "dv",
     "maxclass": "newobj",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      760,
      300,
      50,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "/ 127."
    }
   },
   {
    "box": {
     "id": "qa",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      760,
      330,
      100,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend hitamt"
    }
   },
   {
    "box": {
     "id": "bt",
     "maxclass": "button",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      620,
      270,
      24,
      24
     ],
     "outlettype": [
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "ct",
     "maxclass": "newobj",
     "numinlets": 3,
     "numoutlets": 4,
     "patching_rect": [
      660,
      300,
      70,
      22
     ],
     "outlettype": [
      "",
      "",
      "",
      ""
     ],
     "text": "counter"
    }
   },
   {
    "box": {
     "id": "qh",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      660,
      330,
      80,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend hit"
    }
   },
   {
    "box": {
     "id": "cm2",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      560,
      300,
      100,
      20
     ],
     "text": "strike (or click)"
    }
   },
   {
    "box": {
     "id": "lb",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      20,
      390,
      70,
      22
     ],
     "outlettype": [
      "bang"
     ],
     "text": "loadbang"
    }
   },
   {
    "box": {
     "id": "df",
     "maxclass": "message",
     "numinlets": 2,
     "numoutlets": 1,
     "patching_rect": [
      20,
      420,
      520,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "root 55, pulse 80, ground 1, level 1, height 0.5, room 0.7, edge 0.4, hitamt 0.6"
    }
   },
   {
    "box": {
     "id": "cm3",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      580,
      390,
      260,
      20
     ],
     "text": "by hand: drag a number, then send it"
    }
   },
   {
    "box": {
     "id": "fn0",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      580,
      420,
      60,
      22
     ],
     "outlettype": [
      "",
      "bang"
     ],
     "minimum": 0.0,
     "maximum": 1.0,
     "format": 6
    }
   },
   {
    "box": {
     "id": "fp0",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      580,
      450,
      66,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend energy"
    }
   },
   {
    "box": {
     "id": "fn1",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      650,
      420,
      60,
      22
     ],
     "outlettype": [
      "",
      "bang"
     ],
     "minimum": 0.0,
     "maximum": 1.0,
     "format": 6
    }
   },
   {
    "box": {
     "id": "fp1",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      650,
      450,
      66,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend follow"
    }
   },
   {
    "box": {
     "id": "fn2",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      720,
      420,
      60,
      22
     ],
     "outlettype": [
      "",
      "bang"
     ],
     "minimum": 0.0,
     "maximum": 1.0,
     "format": 6
    }
   },
   {
    "box": {
     "id": "fp2",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      720,
      450,
      66,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend form"
    }
   },
   {
    "box": {
     "id": "fn3",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      790,
      420,
      60,
      22
     ],
     "outlettype": [
      "",
      "bang"
     ],
     "minimum": 0.0,
     "maximum": 1.0,
     "format": 6
    }
   },
   {
    "box": {
     "id": "fp3",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      790,
      450,
      66,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend still"
    }
   },
   {
    "box": {
     "id": "fn4",
     "maxclass": "flonum",
     "numinlets": 1,
     "numoutlets": 2,
     "patching_rect": [
      860,
      420,
      60,
      22
     ],
     "outlettype": [
      "",
      "bang"
     ],
     "minimum": 0.0,
     "maximum": 1.0,
     "format": 6
    }
   },
   {
    "box": {
     "id": "fp4",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 1,
     "patching_rect": [
      860,
      450,
      66,
      22
     ],
     "outlettype": [
      ""
     ],
     "text": "prepend storm"
    }
   },
   {
    "box": {
     "id": "rnbo",
     "maxclass": "newobj",
     "numinlets": 1,
     "numoutlets": 3,
     "patching_rect": [
      20,
      490,
      300,
      22
     ],
     "outlettype": [
      "signal",
      "signal",
      "list"
     ],
     "text": "rnbo~",
     "patcher": {
      "fileversion": 1,
      "appversion": {
       "major": 8,
       "minor": 6,
       "revision": 0,
       "architecture": "x64",
       "modernui": 1
      },
      "classnamespace": "rnbo",
      "rect": [
       80,
       80,
       960,
       780
      ],
      "gridsize": [
       15,
       15
      ],
      "boxes": [
       {
        "box": {
         "id": "p0",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          20,
          20,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param energy @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p1",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          170,
          20,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param follow @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p2",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          320,
          20,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param form @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p3",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          470,
          20,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param still @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p4",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          620,
          20,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param height @value 0.5 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p5",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          770,
          20,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param pan @value 0 @min -1 @max 1"
        }
       },
       {
        "box": {
         "id": "p6",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          20,
          56,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param storm @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p7",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          170,
          56,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param edge @value 0.4 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p8",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          320,
          56,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param room @value 0.7 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p9",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          470,
          56,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param pulse @value 80 @min 4 @max 200"
        }
       },
       {
        "box": {
         "id": "p10",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          620,
          56,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param root @value 55 @min 20 @max 880"
        }
       },
       {
        "box": {
         "id": "p11",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          770,
          56,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param ground @value 1 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p12",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          20,
          92,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param water @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p13",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          170,
          92,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param fire @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p14",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          320,
          92,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param wind @value 0 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p15",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          470,
          92,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param level @value 1 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "p16",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          620,
          92,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param hit @value 0 @min 0 @max 100000000"
        }
       },
       {
        "box": {
         "id": "p17",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 2,
         "patching_rect": [
          770,
          92,
          140,
          22
         ],
         "outlettype": [
          "",
          ""
         ],
         "text": "param hitamt @value 0.6 @min 0 @max 1"
        }
       },
       {
        "box": {
         "id": "cb",
         "maxclass": "codebox~",
         "numinlets": 18,
         "numoutlets": 2,
         "patching_rect": [
          20,
          140,
          900,
          560
         ],
         "outlettype": [
          "signal",
          "signal"
         ],
         "code": "// OMT instrument · starter voice v0.1 (RNBO codebox~)\n// One instrument, two drivers: parameters follow omt/rnbo/CONTRACT.md.\n// Layers: bed (four world ladders) · line · strike (bell) · storm (Euclidean 16ths) · edge. Space comes after (site hall / your Max space).\n\n@state seed = 12345;\n@state sEn = 0;\n@state sFol = 0;\n@state sForm = 0;\n@state sStill = 0;\n@state sH = 0.5;\n@state sPan = 0;\n@state sStorm = 0;\n@state sEdge = 0.4;\n@state sPulse = 80;\n@state sRoot = 55;\n@state sW0 = 1;\n@state sW1 = 0;\n@state sW2 = 0;\n@state sW3 = 0;\n@state sLvl = 0;\n@state breathPh = 0;\n@state bph = 0;\n@state lineF = 220;\n@state lineT = 220;\n@state lineEnv = 0;\n@state lineAmp = 0;\n@state lineDec = 0.9999;\n@state linePh = 0;\n@state sixPh = 0;\n@state sixStep = 0;\n@state gateS = 1;\n@state lowA = 0;\n@state bandA = 0;\n@state lowB = 0;\n@state bandB = 0;\n@state lastHit = 0;\n@state bF = 440;\n@state bE1 = 0;\n@state bE2 = 0;\n@state bE3 = 0;\n@state bS1 = 0;\n@state bS2 = 0;\n@state bS3 = 0;\n@state bD1 = 0.999;\n@state bD2 = 0.999;\n@state bD3 = 0.999;\n@state bP1 = 0;\n@state bP2 = 0;\n@state bP3 = 0;\n@state bPan = 0;\n@state ph0_0 = 0.0;\n@state ph0_1 = 0.3;\n@state ph0_2 = 0.6;\n@state ph0_3 = 0.9;\n@state ph0_4 = 0.2;\n@state ph0_5 = 0.5;\n@state ph1_0 = 0.7;\n@state ph1_1 = 0.0;\n@state ph1_2 = 0.3;\n@state ph1_3 = 0.6;\n@state ph1_4 = 0.9;\n@state ph1_5 = 0.2;\n@state ph2_0 = 0.4;\n@state ph2_1 = 0.7;\n@state ph2_2 = 0.0;\n@state ph2_3 = 0.3;\n@state ph2_4 = 0.6;\n@state ph2_5 = 0.9;\n@state ph3_0 = 0.1;\n@state ph3_1 = 0.4;\n@state ph3_2 = 0.7;\n@state ph3_3 = 0.0;\n@state ph3_4 = 0.3;\n@state ph3_5 = 0.6;\n\nlet sr = samplerate();\nlet TAU = 6.283185307179586;\n// inputs (raw from the driver; all smoothing happens here, so the feel is designed in the patch)\nlet pEnergy = in1;\nlet pFollow = in2;\nlet pForm = in3;\nlet pStill = in4;\nlet pHeight = in5;\nlet pPan = in6;\nlet pStorm = in7;\nlet pEdge = in8;\nlet pRoom = in9;\nlet pPulse = in10;\nlet pRoot = in11;\nlet pW0 = in12;\nlet pW1 = in13;\nlet pW2 = in14;\nlet pW3 = in15;\nlet pLevel = in16;\nlet pHit = in17;\nlet pHitAmt = in18;\nlet kF = 1 - exp(-1 / (0.03 * sr));   // 30 ms: follows the body\nlet kS = 1 - exp(-1 / (0.4 * sr));    // 400 ms: slow things (worlds, root, level)\nlet kA = 1 - exp(-1 / (0.003 * sr));  // 3 ms: attacks without clicks\nsEn = sEn + (pEnergy - sEn) * kF;\nsFol = sFol + (pFollow - sFol) * kF;\nsForm = sForm + (pForm - sForm) * kS;\nsStill = sStill + (pStill - sStill) * kS;\nsH = sH + (pHeight - sH) * kS;\nsPan = sPan + (pPan - sPan) * kS;\nsStorm = sStorm + (pStorm - sStorm) * kF;\nsEdge = sEdge + (pEdge - sEdge) * kS;\nsPulse = sPulse + (pPulse - sPulse) * kS;\nsRoot = sRoot + (pRoot - sRoot) * kS;\nsW0 = sW0 + (pW0 - sW0) * kS;\nsW1 = sW1 + (pW1 - sW1) * kS;\nsW2 = sW2 + (pW2 - sW2) * kS;\nsW3 = sW3 + (pW3 - sW3) * kS;\nsLvl = sLvl + (pLevel - sLvl) * kS;\n\n// the strongest world leads the line, the strikes and the storm gate\nlet dw = 0; let dv = sW0;\nif (sW1 > dv) { dw = 1; dv = sW1; }\nif (sW2 > dv) { dw = 2; dv = sW2; }\nif (sW3 > dv) { dw = 3; dv = sW3; }\n\n// ---- 1 · bed: each world is a ladder of partials over the root; form and energy open the ladder, height tilts it bright ----\nlet bedOpen = clamp(sForm * 1.2 + sEn * 0.5 + sStill * 0.25, 0, 1) * 6;   // stillness lets a few partials ring\nlet bedLv = 0.2 + (0.75 * sFol + 0.25 * sForm) * 0.8;\nbreathPh = breathPh + 0.1 / sr; if (breathPh >= 1) breathPh = breathPh - 1;\nlet swell = 1 + sStill * 0.3 * sin(TAU * breathPh);   // stillness breathes\nlet pe = clamp(sPan * 0.5 - 0.3, -1, 1); let po = clamp(sPan * 0.5 + 0.3, -1, 1); let pc = sPan * 0.3;\nlet geL = sqrt(0.5 * (1 - pe)); let geR = sqrt(0.5 * (1 + pe));\nlet goL = sqrt(0.5 * (1 - po)); let goR = sqrt(0.5 * (1 + po));\nlet gcL = sqrt(0.5 * (1 - pc)); let gcR = sqrt(0.5 * (1 + pc));\nlet bedL = 0; let bedR = 0; let ny = sr * 0.45;\n// world 土\nph0_0 = ph0_0 + sRoot * 1 / sr; if (ph0_0 >= 1) ph0_0 = ph0_0 - 1;\nif (sRoot * 1 < ny) { let x = sin(TAU * ph0_0) * sW0 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);\n  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }\nph0_1 = ph0_1 + sRoot * 2 / sr; if (ph0_1 >= 1) ph0_1 = ph0_1 - 1;\nif (sRoot * 2 < ny) { let x = sin(TAU * ph0_1) * sW0 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph0_2 = ph0_2 + sRoot * 3 / sr; if (ph0_2 >= 1) ph0_2 = ph0_2 - 1;\nif (sRoot * 3 < ny) { let x = sin(TAU * ph0_2) * sW0 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph0_3 = ph0_3 + sRoot * 4 / sr; if (ph0_3 >= 1) ph0_3 = ph0_3 - 1;\nif (sRoot * 4 < ny) { let x = sin(TAU * ph0_3) * sW0 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph0_4 = ph0_4 + sRoot * 6 / sr; if (ph0_4 >= 1) ph0_4 = ph0_4 - 1;\nif (sRoot * 6 < ny) { let x = sin(TAU * ph0_4) * sW0 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph0_5 = ph0_5 + sRoot * 5 / sr; if (ph0_5 >= 1) ph0_5 = ph0_5 - 1;\nif (sRoot * 5 < ny) { let x = sin(TAU * ph0_5) * sW0 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\n// world 水\nph1_0 = ph1_0 + sRoot * 2 / sr; if (ph1_0 >= 1) ph1_0 = ph1_0 - 1;\nif (sRoot * 2 < ny) { let x = sin(TAU * ph1_0) * sW1 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);\n  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }\nph1_1 = ph1_1 + sRoot * 3 / sr; if (ph1_1 >= 1) ph1_1 = ph1_1 - 1;\nif (sRoot * 3 < ny) { let x = sin(TAU * ph1_1) * sW1 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph1_2 = ph1_2 + sRoot * 4 / sr; if (ph1_2 >= 1) ph1_2 = ph1_2 - 1;\nif (sRoot * 4 < ny) { let x = sin(TAU * ph1_2) * sW1 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph1_3 = ph1_3 + sRoot * 6 / sr; if (ph1_3 >= 1) ph1_3 = ph1_3 - 1;\nif (sRoot * 6 < ny) { let x = sin(TAU * ph1_3) * sW1 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph1_4 = ph1_4 + sRoot * 5 / sr; if (ph1_4 >= 1) ph1_4 = ph1_4 - 1;\nif (sRoot * 5 < ny) { let x = sin(TAU * ph1_4) * sW1 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph1_5 = ph1_5 + sRoot * 10 / sr; if (ph1_5 >= 1) ph1_5 = ph1_5 - 1;\nif (sRoot * 10 < ny) { let x = sin(TAU * ph1_5) * sW1 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\n// world 火\nph2_0 = ph2_0 + sRoot * 4 / sr; if (ph2_0 >= 1) ph2_0 = ph2_0 - 1;\nif (sRoot * 4 < ny) { let x = sin(TAU * ph2_0) * sW2 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);\n  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }\nph2_1 = ph2_1 + sRoot * 6 / sr; if (ph2_1 >= 1) ph2_1 = ph2_1 - 1;\nif (sRoot * 6 < ny) { let x = sin(TAU * ph2_1) * sW2 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph2_2 = ph2_2 + sRoot * 7 / sr; if (ph2_2 >= 1) ph2_2 = ph2_2 - 1;\nif (sRoot * 7 < ny) { let x = sin(TAU * ph2_2) * sW2 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph2_3 = ph2_3 + sRoot * 9 / sr; if (ph2_3 >= 1) ph2_3 = ph2_3 - 1;\nif (sRoot * 9 < ny) { let x = sin(TAU * ph2_3) * sW2 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph2_4 = ph2_4 + sRoot * 11 / sr; if (ph2_4 >= 1) ph2_4 = ph2_4 - 1;\nif (sRoot * 11 < ny) { let x = sin(TAU * ph2_4) * sW2 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph2_5 = ph2_5 + sRoot * 13 / sr; if (ph2_5 >= 1) ph2_5 = ph2_5 - 1;\nif (sRoot * 13 < ny) { let x = sin(TAU * ph2_5) * sW2 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\n// world 風\nph3_0 = ph3_0 + sRoot * 16 / sr; if (ph3_0 >= 1) ph3_0 = ph3_0 - 1;\nif (sRoot * 16 < ny) { let x = sin(TAU * ph3_0) * sW3 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);\n  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }\nph3_1 = ph3_1 + sRoot * 24 / sr; if (ph3_1 >= 1) ph3_1 = ph3_1 - 1;\nif (sRoot * 24 < ny) { let x = sin(TAU * ph3_1) * sW3 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph3_2 = ph3_2 + sRoot * 32 / sr; if (ph3_2 >= 1) ph3_2 = ph3_2 - 1;\nif (sRoot * 32 < ny) { let x = sin(TAU * ph3_2) * sW3 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph3_3 = ph3_3 + sRoot * 40 / sr; if (ph3_3 >= 1) ph3_3 = ph3_3 - 1;\nif (sRoot * 40 < ny) { let x = sin(TAU * ph3_3) * sW3 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nph3_4 = ph3_4 + sRoot * 28 / sr; if (ph3_4 >= 1) ph3_4 = ph3_4 - 1;\nif (sRoot * 28 < ny) { let x = sin(TAU * ph3_4) * sW3 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);\n  bedL = bedL + x * geL; bedR = bedR + x * geR; }\nph3_5 = ph3_5 + sRoot * 36 / sr; if (ph3_5 >= 1) ph3_5 = ph3_5 - 1;\nif (sRoot * 36 < ny) { let x = sin(TAU * ph3_5) * sW3 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);\n  bedL = bedL + x * goL; bedR = bedR + x * goR; }\nlet bedG = bedLv * swell * 0.075;\nbedL = bedL * bedG; bedR = bedR * bedG;\n\n// ---- 2 · line: one voice stepping on the pulse; how often depends on follow, which note on height ----\nlet beatSec = 60 / max(4, sPulse);\nbph = bph + 1 / (beatSec * sr);\nif (bph >= 1) {\n  bph = bph - 1;\n  seed = (seed * 16807) % 2147483647; let r1 = seed / 2147483647;\n  seed = (seed * 16807) % 2147483647; let r2 = seed / 2147483647;\n  if (sEn > 0.03 && r1 < 0.15 + sFol * 0.8) {\n    let li = floor(clamp(sH * 4 + r2 * 2, 0, 5));\n    let lh = 1;\n    if (dw == 0) {\n      if (li == 0) lh = 1;\n      if (li == 1) lh = 2;\n      if (li == 2) lh = 3;\n      if (li == 3) lh = 4;\n      if (li == 4) lh = 6;\n      if (li == 5) lh = 5;\n    } else if (dw == 1) {\n      if (li == 0) lh = 2;\n      if (li == 1) lh = 3;\n      if (li == 2) lh = 4;\n      if (li == 3) lh = 6;\n      if (li == 4) lh = 5;\n      if (li == 5) lh = 10;\n    } else if (dw == 2) {\n      if (li == 0) lh = 4;\n      if (li == 1) lh = 6;\n      if (li == 2) lh = 7;\n      if (li == 3) lh = 9;\n      if (li == 4) lh = 11;\n      if (li == 5) lh = 13;\n    } else if (dw == 3) {\n      if (li == 0) lh = 16;\n      if (li == 1) lh = 24;\n      if (li == 2) lh = 32;\n      if (li == 3) lh = 40;\n      if (li == 4) lh = 28;\n      if (li == 5) lh = 36;\n    }\n    let f = sRoot * lh * 2;\n    if (f < 180) f = f * 2; if (f < 180) f = f * 2; if (f < 180) f = f * 2;\n    if (f > 1400) f = f * 0.5; if (f > 1400) f = f * 0.5; if (f > 1400) f = f * 0.5;\n    lineT = f; lineEnv = 1; lineDec = exp(-1 / (beatSec * 1.5 * sr));\n  }\n}\nlineF = lineF + (lineT - lineF) * kF;   // glide\nlineEnv = lineEnv * lineDec;\nlineAmp = lineAmp + (lineEnv - lineAmp) * kF;\nlinePh = linePh + lineF / sr; if (linePh >= 1) linePh = linePh - 1;\nlet lx = (sin(TAU * linePh) + 0.15 * sin(2 * TAU * linePh)) * lineAmp * 0.09 * (0.35 + 0.65 * clamp(sFol * 2.5, 0, 1)) * (1 - 0.4 * sStill);\nlet lp = clamp(sPan * 0.6, -1, 1);\nlet lineL = lx * sqrt(0.5 * (1 - lp)); let lineR = lx * sqrt(0.5 * (1 + lp));\n\n// ---- 3 · strike: every change of `hit` rings one bell, pitched from the leading world ----\nif (pHit != lastHit) {\n  lastHit = pHit;\n  seed = (seed * 16807) % 2147483647; let r3 = seed / 2147483647;\n  seed = (seed * 16807) % 2147483647; let r4 = seed / 2147483647;\n  let sh = 4; let dec = 5;\n  if (dw == 0) {\n    let si = floor(r3 * 3); dec = 5;\n    if (si == 0) sh = 4;\n    if (si == 1) sh = 6;\n    if (si == 2) sh = 8;\n  } else if (dw == 1) {\n    let si = floor(r3 * 4); dec = 5;\n    if (si == 0) sh = 10;\n    if (si == 1) sh = 12;\n    if (si == 2) sh = 15;\n    if (si == 3) sh = 18;\n  } else if (dw == 2) {\n    let si = floor(r3 * 4); dec = 3;\n    if (si == 0) sh = 14;\n    if (si == 1) sh = 18;\n    if (si == 2) sh = 22;\n    if (si == 3) sh = 26;\n  } else if (dw == 3) {\n    let si = floor(r3 * 2); dec = 7;\n    if (si == 0) sh = 32;\n    if (si == 1) sh = 48;\n  }\n  let f = sRoot * sh;\n  if (f < 400) f = f * 2; if (f < 400) f = f * 2; if (f < 400) f = f * 2; if (f > 4000) f = f * 0.5;\n  bF = f;\n  let amp = 0.16 * clamp(pHitAmt, 0.25, 1);\n  bE1 = amp; bE2 = amp * 0.18; bE3 = amp * 0.06;\n  bD1 = exp(-1 / (dec * sr)); bD2 = exp(-1 / (dec / 2.003 * sr)); bD3 = exp(-1 / (dec / 3.01 * sr));\n  bPan = clamp(sPan * 0.7 + (r4 - 0.5) * 0.4, -1, 1);\n}\nbE1 = bE1 * bD1; bE2 = bE2 * bD2; bE3 = bE3 * bD3;\nbS1 = bS1 + (bE1 - bS1) * kA; bS2 = bS2 + (bE2 - bS2) * kA; bS3 = bS3 + (bE3 - bS3) * kA;\nbP1 = bP1 + bF / sr; if (bP1 >= 1) bP1 = bP1 - 1;\nbP2 = bP2 + bF * 2.003 / sr; if (bP2 >= 1) bP2 = bP2 - 1;\nbP3 = bP3 + bF * 3.01 / sr; if (bP3 >= 1) bP3 = bP3 - 1;\nlet bx = sin(TAU * bP1) * bS1 + sin(TAU * bP2) * bS2 + sin(TAU * bP3) * bS3;\nlet bellL = bx * sqrt(0.5 * (1 - bPan)); let bellR = bx * sqrt(0.5 * (1 + bPan));\n\n// ---- 4 · storm: resonant noise, chopped by an even (Euclidean) rhythm on sixteenths that thins as the storm grows ----\nsixPh = sixPh + 4 / (beatSec * sr);\nlet sg = 0.12;\nif (dw == 1) sg = 0.2;\nif (dw == 2) sg = 0.45;\nif (dw == 3) sg = 0.15;\nif (sixPh >= 1) { sixPh = sixPh - 1; sixStep = (sixStep + 1) % 16; }\nlet ek = clamp(floor(16 - (sg * 2.2 + 0.2) * sStorm * 14 + 0.5), 3, 13);\nlet gOn = 1;\nif (sStorm > 0.35) { gOn = 0.1; if (floor((sixStep + 1) * ek / 16) != floor(sixStep * ek / 16)) gOn = 1; }\ngateS = gateS + (gOn - gateS) * (1 - exp(-1 / (0.004 * sr)));\nseed = (seed * 16807) % 2147483647; let nz = seed / 1073741823.5 - 1;\nlet fcA = clamp(sRoot * 16 * (1 + sH), 200, 5000); let fcB = clamp(fcA * 1.5, 200, 7000);\nlet fa = 2 * sin(3.141592653589793 * fcA / sr); let fb = 2 * sin(3.141592653589793 * fcB / sr);\nlowA = lowA + fa * bandA; let hiA = nz - lowA - 0.15 * bandA; bandA = bandA + fa * hiA;\nlowB = lowB + fb * bandB; let hiB = nz - lowB - 0.15 * bandB; bandB = bandB + fb * hiB;\nlet stG = sStorm * sStorm * 0.06 * gateS;\nlet stormL = bandA * stG; let stormR = bandB * stG;\n\n// ---- 5 · edge and out: drive rises with edge × energy; soft ceiling at about −3 dBFS ----\nlet mixL = bedL + lineL + bellL + stormL; let mixR = bedR + lineR + bellR + stormR;\nlet drv = sEdge * sEn;\nlet dk = 1 + drv * 4;\nmixL = mixL + (tanh(mixL * dk) / dk * 1.5 - mixL) * drv;\nmixR = mixR + (tanh(mixR * dk) / dk * 1.5 - mixR) * drv;\nout1 = 0.7 * tanh(mixL * sLvl * 1.4);\nout2 = 0.7 * tanh(mixR * sLvl * 1.4);\n",
         "fontface": 0,
         "fontsize": 11.0
        }
       },
       {
        "box": {
         "id": "o1",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          20,
          720,
          60,
          22
         ],
         "text": "out~ 1"
        }
       },
       {
        "box": {
         "id": "o2",
         "maxclass": "newobj",
         "numinlets": 1,
         "numoutlets": 0,
         "patching_rect": [
          860,
          720,
          60,
          22
         ],
         "text": "out~ 2"
        }
       }
      ],
      "lines": [
       {
        "patchline": {
         "source": [
          "p0",
          0
         ],
         "destination": [
          "cb",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p1",
          0
         ],
         "destination": [
          "cb",
          1
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p2",
          0
         ],
         "destination": [
          "cb",
          2
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p3",
          0
         ],
         "destination": [
          "cb",
          3
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p4",
          0
         ],
         "destination": [
          "cb",
          4
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p5",
          0
         ],
         "destination": [
          "cb",
          5
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p6",
          0
         ],
         "destination": [
          "cb",
          6
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p7",
          0
         ],
         "destination": [
          "cb",
          7
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p8",
          0
         ],
         "destination": [
          "cb",
          8
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p9",
          0
         ],
         "destination": [
          "cb",
          9
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p10",
          0
         ],
         "destination": [
          "cb",
          10
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p11",
          0
         ],
         "destination": [
          "cb",
          11
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p12",
          0
         ],
         "destination": [
          "cb",
          12
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p13",
          0
         ],
         "destination": [
          "cb",
          13
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p14",
          0
         ],
         "destination": [
          "cb",
          14
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p15",
          0
         ],
         "destination": [
          "cb",
          15
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p16",
          0
         ],
         "destination": [
          "cb",
          16
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "p17",
          0
         ],
         "destination": [
          "cb",
          17
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "cb",
          0
         ],
         "destination": [
          "o1",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "cb",
          1
         ],
         "destination": [
          "o2",
          0
         ]
        }
       }
      ]
     },
     "rnboattrcache": {},
     "varname": "omt",
     "saved_object_attributes": {
      "optimization": "O1",
      "parameter_enable": 1,
      "uuid": "69ed6a14-042f-4dda-ad4e-71ed15f1bad7"
     }
    }
   },
   {
    "box": {
     "id": "dac",
     "maxclass": "ezdac~",
     "numinlets": 2,
     "numoutlets": 0,
     "patching_rect": [
      20,
      540,
      45,
      45
     ]
    }
   },
   {
    "box": {
     "id": "cm4",
     "maxclass": "comment",
     "numinlets": 1,
     "numoutlets": 0,
     "patching_rect": [
      90,
      550,
      520,
      20
     ],
     "text": "space: add your reverb between rnbo~ and the speaker for the Mac set (the site adds its own hall)"
    }
   }
  ],
  "lines": [
   {
    "patchline": {
     "source": [
      "c0",
      0
     ],
     "destination": [
      "s0",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s0",
      0
     ],
     "destination": [
      "q0",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q0",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c1",
      0
     ],
     "destination": [
      "s1",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s1",
      0
     ],
     "destination": [
      "q1",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q1",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c2",
      0
     ],
     "destination": [
      "s2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s2",
      0
     ],
     "destination": [
      "q2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q2",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c3",
      0
     ],
     "destination": [
      "s3",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s3",
      0
     ],
     "destination": [
      "q3",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q3",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c4",
      0
     ],
     "destination": [
      "s4",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s4",
      0
     ],
     "destination": [
      "q4",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q4",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c5",
      0
     ],
     "destination": [
      "s5",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s5",
      0
     ],
     "destination": [
      "q5",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q5",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c6",
      0
     ],
     "destination": [
      "s6",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s6",
      0
     ],
     "destination": [
      "q6",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q6",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c7",
      0
     ],
     "destination": [
      "s7",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s7",
      0
     ],
     "destination": [
      "q7",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q7",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c8",
      0
     ],
     "destination": [
      "s8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s8",
      0
     ],
     "destination": [
      "q8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q8",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c9",
      0
     ],
     "destination": [
      "s9",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s9",
      0
     ],
     "destination": [
      "q9",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q9",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "c10",
      0
     ],
     "destination": [
      "s10",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "s10",
      0
     ],
     "destination": [
      "q10",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "q10",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "cr",
      0
     ],
     "destination": [
      "sr",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "sr",
      0
     ],
     "destination": [
      "dr",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "dr",
      0
     ],
     "destination": [
      "qr",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "qr",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "cw",
      0
     ],
     "destination": [
      "tw",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tw",
      4
     ],
     "destination": [
      "nw",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tw",
      3
     ],
     "destination": [
      "bw0",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "nw",
      0
     ],
     "destination": [
      "bw0",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "bw0",
      0
     ],
     "destination": [
      "qw0",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "qw0",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tw",
      2
     ],
     "destination": [
      "bw1",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "nw",
      0
     ],
     "destination": [
      "bw1",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "bw1",
      0
     ],
     "destination": [
      "qw1",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "qw1",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tw",
      1
     ],
     "destination": [
      "bw2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "nw",
      0
     ],
     "destination": [
      "bw2",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "bw2",
      0
     ],
     "destination": [
      "qw2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "qw2",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tw",
      0
     ],
     "destination": [
      "bw3",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "nw",
      0
     ],
     "destination": [
      "bw3",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "bw3",
      0
     ],
     "destination": [
      "qw3",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "qw3",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "ni",
      1
     ],
     "destination": [
      "sv",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "sv",
      1
     ],
     "destination": [
      "tv",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tv",
      1
     ],
     "destination": [
      "dv",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "dv",
      0
     ],
     "destination": [
      "qa",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "qa",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "tv",
      0
     ],
     "destination": [
      "ct",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "bt",
      0
     ],
     "destination": [
      "ct",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "ct",
      0
     ],
     "destination": [
      "qh",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "qh",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "lb",
      0
     ],
     "destination": [
      "df",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "df",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fn0",
      0
     ],
     "destination": [
      "fp0",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fp0",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fn1",
      0
     ],
     "destination": [
      "fp1",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fp1",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fn2",
      0
     ],
     "destination": [
      "fp2",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fp2",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fn3",
      0
     ],
     "destination": [
      "fp3",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fp3",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fn4",
      0
     ],
     "destination": [
      "fp4",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "fp4",
      0
     ],
     "destination": [
      "rnbo",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "rnbo",
      0
     ],
     "destination": [
      "dac",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "rnbo",
      1
     ],
     "destination": [
      "dac",
      1
     ]
    }
   }
  ]
 }
}