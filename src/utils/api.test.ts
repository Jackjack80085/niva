import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from './api';
test('frontend never accepts the Vercel SPA HTML fallback as a successful API response',async context=>{
  context.mock.method(globalThis,'fetch',async()=>new Response('<!doctype html><html></html>',{status:200,headers:{'Content-Type':'text/html'}}));
  await assert.rejects(api('/admin/session'),/frontend only/);
});
test('frontend distinguishes a missing API route from an incorrect admin password',async context=>{
  const mock=context.mock.method(globalThis,'fetch',async()=>new Response(null,{status:405}));
  await assert.rejects(api('/admin/login',{method:'POST'}),/backend is not available/);
  mock.mock.mockImplementation(async()=>new Response(JSON.stringify({error:'Incorrect admin password.'}),{status:401,headers:{'Content-Type':'application/json'}}));
  await assert.rejects(api('/admin/login',{method:'POST'}),/Incorrect admin password/);
});
test('frontend rejects invalid JSON and error payloads even on HTTP 200',async context=>{
  const mock=context.mock.method(globalThis,'fetch',async()=>new Response('invalid',{headers:{'Content-Type':'application/json'}}));
  await assert.rejects(api('/config'),/invalid response/);
  mock.mock.mockImplementation(async()=>new Response(JSON.stringify({error:'Backend setup missing.'}),{headers:{'Content-Type':'application/json'}}));
  await assert.rejects(api('/config'),/Backend setup missing/);
  mock.mock.mockImplementation(async()=>new Response(JSON.stringify({authenticated:true}),{headers:{'Content-Type':'application/json'}}));
  assert.equal((await api<{authenticated:boolean}>('/admin/login')).authenticated,true);
});

test('bodyless JSON mutations send an empty object so logout passes the API firewall',async context=>{
  context.mock.method(globalThis,'fetch',async(_url,options)=>{
    assert.equal(options?.method,'POST');
    assert.equal(options?.body,'{}');
    assert.equal(new Headers(options?.headers).get('Content-Type'),'application/json');
    return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
  });
  assert.deepEqual(await api('/admin/logout',{method:'POST'}),{ok:true});
});
