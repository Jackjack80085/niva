import React,{useState} from 'react';
import {useApp} from '../../context/AppContext';
import {LockKeyhole,ArrowLeft} from 'lucide-react';
export const AdminPortalPage=()=>{
 const app=useApp();const [pin,setPin]=useState('');const [error,setError]=useState(false);
 return <div className="portal-page"><button onClick={()=>app.setActiveView('patient-home')}><ArrowLeft size={16}/> Back to website</button><section className="practice-card"><LockKeyhole size={32}/><p className="eyebrow">DR. NIVA · ONLINE PRACTICE</p><h1>A space for your practice.</h1><p>Sign in as the doctor or an associate to continue.</p><form className="space-y-5" onSubmit={e=>{e.preventDefault();if(app.verifyAdminPasscode(pin)){window.location.hash='admin';}else setError(true);}}><label>Workspace PIN<input aria-label="Workspace PIN" type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" maxLength={4} required value={pin} onChange={e=>{setPin(e.target.value);setError(false);}}/></label>{error&&<p className="error" role="alert">Incorrect PIN or disabled associate account.</p>}<button className="primary">Enter workspace</button></form><p className="demo-banner">Local demo · Doctor PIN: 2026. Create associate PINs in Team & access. This is a preview login, not production authentication.</p></section></div>;
};
