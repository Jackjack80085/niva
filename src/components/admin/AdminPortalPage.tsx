import {useState} from 'react';
import {useApp} from '../../context/AppContext';
import {LockKeyhole,ArrowLeft} from 'lucide-react';
export const AdminPortalPage=()=>{
  const app=useApp();
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  return <div className="portal-page"><button onClick={()=>app.setActiveView('patient-home')}><ArrowLeft size={16}/> Back to website</button><section className="practice-card"><LockKeyhole size={32}/><p className="eyebrow">DR. NIVA · ONLINE PRACTICE</p><h1>A space for your practice.</h1><p>Sign in to review appointment requests.</p><form className="space-y-5" onSubmit={async event=>{event.preventDefault();setError('');setBusy(true);try{await app.verifyAdminPasscode(password);}catch(err){setError((err as Error).message||'Unable to sign in. Please try again.');}finally{setBusy(false);}}}><label>Admin password<input aria-label="Admin password" type="password" autoComplete="current-password" maxLength={256} required disabled={busy} value={password} onChange={event=>{setPassword(event.target.value);setError('');}}/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Signing in…':'Enter workspace'}</button></form>{import.meta.env.DEV&&<p className="demo-banner">Local development password: 2026. Set ADMIN_PASSWORD before deployment.</p>}</section></div>;
};
