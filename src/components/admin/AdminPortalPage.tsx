import React,{useState} from 'react';
import {useApp} from '../../context/AppContext';
import {LockKeyhole,ArrowLeft} from 'lucide-react';
export const AdminPortalPage=()=>{
 const app=useApp();const [pin,setPin]=useState('');const [error,setError]=useState(false);
 return <div className="portal-page"><button onClick={()=>app.setActiveView('patient-home')}><ArrowLeft size={16}/> Back to website</button><section className="practice-card"><LockKeyhole size={32}/><p className="eyebrow">DR. NIVA · ONLINE PRACTICE</p><h1>A space for your practice.</h1><p>Sign in to review appointment requests.</p><form className="space-y-5" onSubmit={async e=>{e.preventDefault();if(await app.verifyAdminPasscode(pin)){window.location.hash='admin';}else setError(true);}}><label>Admin password<input aria-label="Admin password" type="password" autoComplete="current-password" maxLength={256} required value={pin} onChange={e=>{setPin(e.target.value);setError(false);}}/></label>{error&&<p className="error" role="alert">Unable to sign in. Check your password and backend connection.</p>}<button className="primary">Enter workspace</button></form>{import.meta.env.DEV && <p className="demo-banner">Local development password: 2026. Set ADMIN_PASSWORD before deployment.</p>}</section></div>;
};
