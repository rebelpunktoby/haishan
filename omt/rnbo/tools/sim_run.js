const {tick,params}=require('./voice_sim.js');const SR=48000;
const D={energy:0,follow:0,form:0,still:0,height:.5,pan:0,storm:0,edge:.4,room:.7,pulse:80,root:55,ground:1,water:0,fire:0,wind:0,level:1,hit:0,hitamt:.6};
function run(name,secs,P){let s2=0,pk=0,n=0,nan=0;for(let i=0;i<secs*SR;i++){const t=i/SR;const q=Object.assign({},D,P,P.fn?P.fn(t):{});
 const [a,b]=tick(...params.map(k=>q[k]));if(!isFinite(a)||!isFinite(b))nan++;if(t>secs-1.5){s2+=a*a+b*b;n+=2;pk=Math.max(pk,Math.abs(a),Math.abs(b))}}
 console.log(name.padEnd(24),'rms',(20*Math.log10(Math.sqrt(s2/n)+1e-9)).toFixed(1).padStart(6),'dB   peak',(20*Math.log10(pk+1e-9)).toFixed(1).padStart(6),'dB',nan?'  NaN x'+nan:'');}
run('level 0 (must be silent)',3,{level:0});run('still',4,{still:1});run('slow',4,{energy:.3,follow:.2,form:.3});
run('fast',4,{energy:.9,follow:.8,form:.7});run('fast + storm',4,{energy:1,follow:1,form:.9,storm:.9});
run('all worlds, edge 1',4,{energy:1,follow:1,form:.9,storm:.9,water:.5,fire:.5,wind:.5,edge:1});
run('one strike',3,{fn:t=>({hit:t>1?1:0,hitamt:1})});run('root 880, wind, high',3,{root:880,ground:0,wind:1,energy:1,follow:1,form:1,height:1});
