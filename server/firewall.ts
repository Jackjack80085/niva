import { createServer, request as proxyRequest, type IncomingMessage, type ServerResponse } from 'node:http';
import { connect } from 'node:net';
import type { RequestHandler } from 'express';
import { createHash } from 'node:crypto';
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');

export function securityHeaders(production:boolean):Record<string,string> {
  const scripts=production?"'self' https://checkout.razorpay.com":"'self' 'unsafe-inline' https://checkout.razorpay.com";
  return {
    'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy':'same-origin-allow-popups','Cross-Origin-Resource-Policy':'same-origin',
    'Content-Security-Policy':`default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src ${scripts}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://i.ytimg.com https://*.razorpay.com; connect-src 'self' ${production?'':'ws: wss:'} https://*.razorpay.com; frame-src https://www.youtube-nocookie.com https://*.razorpay.com; ${production?'upgrade-insecure-requests':''}`,
    ...(production?{'Strict-Transport-Security':'max-age=31536000; includeSubDomains'}:{}),
  };
}
export const apiFirewall=(gatewaySecret?:string,production=false):RequestHandler=>(req,res,next)=>{
  for(const [key,value] of Object.entries(securityHeaders(production)))res.setHeader(key,value);
  // The edge strips caller-supplied credentials and injects its own private shared value.
  if(gatewaySecret&&hash(req.get('x-niva-gateway')||'')!==hash(gatewaySecret))return res.status(403).json({error:'Requests must pass through the application gateway.'});
  if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'Cross-site API requests are not allowed.'});
  if(!['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(req.method))return res.status(405).json({error:'Method is not allowed.'});
  if(req.url.length>2048)return res.status(414).json({error:'Request URL is too long.'});
  const length=Number(req.get('content-length')||0);
  if(length>128*1024)return res.status(413).json({error:'Request body is too large.'});
  if(req.get('content-encoding')&&req.get('content-encoding')!=='identity')return res.status(415).json({error:'Compressed API requests are not accepted.'});
  if(['POST','PUT','PATCH'].includes(req.method)&&!req.is('application/json'))return res.status(415).json({error:'Use application/json for API requests.'});
  next();
};
export type EdgeConfig={production:boolean;appUrl:string;backendPort:number;vitePort?:number;secret:string;requestLimit?:number;windowMs?:number};
const privatePath=(path:string,development=false)=>{
  if(development&&/^\/node_modules\/\.vite\/deps\/[a-zA-Z0-9_.-]+\.js$/.test(path))return false;
  let decoded=path;
  try{for(let i=0;i<3;i++){const next=decodeURIComponent(decoded);if(next===decoded)break;decoded=next;}}catch{return true;}
  return decoded.includes('\\')||decoded.includes('\0')||decoded.split('/').some(part=>part==='..'||(part.startsWith('.')&&part!=='.well-known'))||(/^\/data(?:\/|$)/i.test(decoded)||/(?:^|\/)(?:server|scripts|node_modules\/\.cache)(?:\/|$)/i.test(decoded))||/\.(?:sqlite(?:-wal|-shm)?|key|pem|env|log|map|bak|sql)(?:$|\/)/i.test(decoded);
};
const apiPaths=[
  /^\/(?:health|config|availability|events)$/,
  /^\/admin\/(?:login|logout|session|appointments|jobs|calendar|availability|blocks|event)$/,
  /^\/admin\/(?:jobs\/retry|event\/(?:visibility|registrations))$/,
  /^\/admin\/appointments\/[a-zA-Z0-9_-]+\/decision$/,
  /^\/admin\/blocks\/[a-zA-Z0-9_-]+$/,
  /^\/appointments(?:\/[a-zA-Z0-9_-]+(?:\/payment\/(?:order|verify))?)?$/,
  /^\/lookup\/(?:start|verify)$/,
  /^\/events\/register$/,
  /^\/events\/registrations\/[a-zA-Z0-9_-]+(?:\/payment\/(?:order|verify))?$/,
  /^\/webhooks\/razorpay$/,
];
export function createEdge(config:EdgeConfig) {
  const counters=new Map<string,{count:number;expires:number;active:number}>();
  const allowedHost=new URL(config.appUrl).host;
  const headers=securityHeaders(config.production);
  function reject(res:ServerResponse,status:number,message:string){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(JSON.stringify({error:message}));}
  function check(req:IncomingMessage,res:ServerResponse) {
    for(const [key,value] of Object.entries(headers))res.setHeader(key,value);
    if(req.headers.host!==allowedHost){reject(res,403,'This host is not allowed.');return false;}
    if(!req.url||req.url.length>2048){reject(res,414,'Request URL is too long.');return false;}
    const path=req.url.split('?')[0];
    if(privatePath(path,!config.production)){reject(res,404,'Not found.');return false;}
    if(!['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(req.method||'')){reject(res,405,'Method is not allowed.');return false;}
    if(path.startsWith('/api/')&&!apiPaths.some(pattern=>pattern.test(path.slice(4)))){reject(res,404,'Endpoint not found.');return false;}
    if(!path.startsWith('/api/')&&!['GET','HEAD'].includes(req.method||'')){reject(res,405,'Method is not allowed.');return false;}
    const now=Date.now();for(const [key,value] of counters)if(value.expires<now&&value.active===0)counters.delete(key);
    const ip=req.socket.remoteAddress||'unknown';
    if(counters.size>10000&&!counters.has(ip)){reject(res,503,'Please try again later.');return false;}
    let state=counters.get(ip);if(!state||state.expires<now){state={count:0,expires:now+(config.windowMs||60_000),active:state?.active||0};counters.set(ip,state);}
    state.count++;if(state.count>(config.requestLimit||600)||state.active>=40){res.setHeader('Retry-After','60');reject(res,429,'Too many requests. Please try again shortly.');return false;}
    if(Number(req.headers['content-length']||0)>128*1024){reject(res,413,'Request body is too large.');return false;}
    return true;
  }
  const server=createServer({maxHeaderSize:16*1024},(req,res)=>{
    if(!check(req,res))return;
    const isApi=req.url!.split('?')[0].startsWith('/api/');
    const ip=req.socket.remoteAddress||'unknown',state=counters.get(ip)!;state.active++;
    let released=false;const release=()=>{if(!released){state.active--;released=true;}};res.on('close',release);
    const forwarded={...req.headers};delete forwarded['x-niva-gateway'];delete forwarded['x-forwarded-for'];delete forwarded['x-forwarded-host'];delete forwarded['x-forwarded-proto'];delete forwarded['forwarded'];
    forwarded['x-niva-gateway']=config.secret;
    // Trusted rate-limit identity is derived here, never from public forwarding headers.
    forwarded['x-niva-client-ip']=ip;
    const upstream=proxyRequest({hostname:'127.0.0.1',port:isApi||!config.vitePort?config.backendPort:config.vitePort,path:req.url,method:req.method,headers:forwarded,timeout:20_000},response=>{
      res.writeHead(response.statusCode||502,{...response.headers,...headers});response.pipe(res);
    });
    upstream.on('timeout',()=>upstream.destroy());upstream.on('error',()=>{if(!res.headersSent)reject(res,502,'The service is temporarily unavailable.');else res.destroy();});
    let size=0;req.on('data',chunk=>{size+=chunk.length;if(size>128*1024){upstream.destroy();if(!res.headersSent)reject(res,413,'Request body is too large.');req.unpipe(upstream);req.resume();}});
    req.on('aborted',()=>upstream.destroy());req.pipe(upstream);
  });
  server.requestTimeout=25_000;server.headersTimeout=10_000;server.keepAliveTimeout=5_000;server.maxRequestsPerSocket=1000;
  server.on('upgrade',(req,socket,head)=>{
    if(!config.vitePort||req.headers.host!==allowedHost||req.headers.origin!==new URL(config.appUrl).origin||!['vite-hmr'].includes(String(req.headers['sec-websocket-protocol']))){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
    const upstream=connect(config.vitePort,'127.0.0.1',()=>{upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n`);for(const [key,value] of Object.entries(req.headers)){if(value!==undefined)upstream.write(`${key}: ${value}\r\n`);}upstream.write('\r\n');if(head.length)upstream.write(head);socket.pipe(upstream).pipe(socket);});
    upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());
  });
  return server;
}
