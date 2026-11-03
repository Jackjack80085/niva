import type { Appointment } from '../types';
export async function api<T>(path:string,options:RequestInit={}):Promise<T> {
  const response=await fetch('/api'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});
  if(!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error('The booking backend is not available on this website. This deployment is serving the frontend only.');
  }
  let data:unknown;
  try {data=await response.json();}catch{throw new Error('The backend returned an invalid response. Please try again.');}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('The backend returned an invalid response.');
  const error=(data as {error?:unknown}).error;
  if(!response.ok||error)throw new Error(typeof error==='string'?error:'The request could not be completed.');
  return data as T;
}
const storageKey='niva_booking_access';
export function savedAccess():Record<string,string> {try{return JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{return {};}}
export function rememberAccess(id:string,token:string) {sessionStorage.setItem(storageKey,JSON.stringify({...savedAccess(),[id]:token}));}
export function accessHeaders(id:string) {return {Authorization:'Bearer '+(savedAccess()[id]||'')};}
export async function loadBooking(id:string) {return (await api<{appointment:Appointment}>(`/appointments/${id}`,{headers:accessHeaders(id)})).appointment;}
