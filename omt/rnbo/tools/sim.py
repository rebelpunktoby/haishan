"""Checks the codebox voice without Max: translates it to JS and renders level checks (needs node).
Run: python3 omt/rnbo/tools/sim.py"""
import pathlib, subprocess, sys
here = pathlib.Path(__file__).resolve().parent
src = (here.parent / 'src' / 'omt-voice.codebox.js').read_text().splitlines()
st = [l.replace('@state', 'let') for l in src if l.startswith('@state')]
params = [l.split(')')[1].split('=')[0].strip() for l in src if l.startswith('@param')]
body = [l for l in src if not l.startswith('@state') and not l.startswith('@param')]
js = ("const {sin,exp,sqrt,tanh,floor,max,min}=Math;const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));const samplerate=()=>48000;\n"
      + "\n".join(st) + f"\nfunction tick({','.join(params)}){{let out1,out2;\n" + "\n".join(body) + "\nreturn [out1,out2];}\nmodule.exports={tick,params:" + repr(params).replace("'", '"') + "};\n")
(here / 'voice_sim.js').write_text(js)
sys.exit(subprocess.call(['node', str(here / 'sim_run.js')]))
