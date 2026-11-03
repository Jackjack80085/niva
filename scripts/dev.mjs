import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { config as dotenv } from 'dotenv';
dotenv({path:'.env.local',quiet:true});dotenv({quiet:true});
const production=process.argv.includes('--production');
const env={...process.env,GATEWAY_SECRET:randomBytes(32).toString('hex'),...(production?{NODE_ENV:'production'}:{})};
const edgeEnv=Object.fromEntries(Object.entries(env).filter(([key])=>['PATH','SYSTEMROOT','NODE_ENV','APP_URL','EDGE_PORT','EDGE_HOST','API_PORT','GATEWAY_SECRET'].includes(key)));
const command=(source)=>production?[`dist-server/${source}.js`]:['--import','tsx',`server/${source}.ts`];
const children=[spawn(process.execPath,command('index'),{stdio:'inherit',env}),spawn(process.execPath,command('edge'),{stdio:'inherit',env:edgeEnv})];
if(!production)children.push(spawn(process.execPath,['node_modules/vite/bin/vite.js','--port','3002','--strictPort','--host','127.0.0.1'],{stdio:'inherit',env}));
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');process.exitCode=code;}
for(const child of children){child.on('error',()=>stop(1));child.on('exit',code=>stop(code||0));}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
