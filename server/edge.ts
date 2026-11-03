import {createEdge} from './firewall';
if(!process.env.GATEWAY_SECRET)throw new Error('Start the application with npm run dev or npm start to enable the private gateway.');
const production=process.env.NODE_ENV==='production';
const appUrl=process.env.APP_URL||'http://localhost:3000';
const edge=createEdge({production,appUrl,secret:process.env.GATEWAY_SECRET,backendPort:Number(process.env.API_PORT||3001),...(!production?{vitePort:3002}:{})});
edge.listen(Number(process.env.EDGE_PORT||3000),process.env.EDGE_HOST||'127.0.0.1',()=>console.log(`Application firewall listening on port ${process.env.EDGE_PORT||3000}.`));
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>edge.close(()=>process.exit(0)));
