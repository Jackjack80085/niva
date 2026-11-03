let loading:Promise<void>|null=null;
export async function loadRazorpay() {
  if((window as any).Razorpay)return;
  if(!loading)loading=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=()=>resolve();script.onerror=()=>{script.remove();loading=null;reject(new Error('Unable to load payment checkout. Please try again.'));};document.head.appendChild(script);});
  await loading;
}
