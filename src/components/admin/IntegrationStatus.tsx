import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
export function IntegrationStatus() {
  const [data,setData]=useState<{calendarConnected:boolean;paymentsConnected:boolean;emailConnected:boolean}|null>(null);
  const [jobs,setJobs]=useState<{id:number;kind:string;status:string;last_error?:string}[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const refresh=async()=>{const [config,result]=await Promise.all([api<any>('/config'),api<{jobs:typeof jobs}>('/admin/jobs')]);setData(config);setJobs(result.jobs.filter(job=>job.status!=='done'));};
  useEffect(()=>{void refresh().catch(err=>setError(err.message));},[]);
  return <section className="practice-card integration-status"><h2>Connected services</h2><div className="integration-badges">{[['Calendar',data?.calendarConnected],['Payments',data?.paymentsConnected],['Email',data?.emailConnected]].map(([name,ready])=><span key={String(name)}>{name} <strong>{!data?'Checking…':ready?'Configured':'Setup pending'}</strong></span>)}</div>{jobs.length>0&&<><p className="muted">{jobs.length} queued or blocked delivery {jobs.length===1?'job':'jobs'}.</p><details><summary>View pending jobs</summary>{jobs.map(job=><p className="muted" key={job.id}>{job.kind.replaceAll('_',' ')} · {job.status}{job.last_error?' · '+job.last_error:''}</p>)}</details><button type="button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await api('/admin/jobs/retry',{method:'POST',body:'{}'});await refresh();}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}>{busy?'Retrying…':'Retry after configuring services'}</button></>}{error&&<p role="alert" className="error">{error}</p>}</section>;
}
