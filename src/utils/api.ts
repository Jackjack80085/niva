import type { Appointment } from '../types';
export async function api<T>(path:string,options:RequestInit={}):Promise<T> {
  const response=await fetch('/api'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});
  const data=await response.json().catch(()=>({error:'The backend is unavailable. Please try again.'}));
  if(!response.ok)throw new Error(data.error||'The request could not be completed.');
  return data as T;
}
const storageKey='niva_booking_access';
export function savedAccess():Record<string,string> {try{return JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{return {};}}
export function rememberAccess(id:string,token:string) {sessionStorage.setItem(storageKey,JSON.stringify({...savedAccess(),[id]:token}));}
export function accessHeaders(id:string) {return {Authorization:'Bearer '+(savedAccess()[id]||'')};}
export async function loadBooking(id:string) {return (await api<{appointment:Appointment}>(`/appointments/${id}`,{headers:accessHeaders(id)})).appointment;}
