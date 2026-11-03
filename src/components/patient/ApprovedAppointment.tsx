import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock3, Video, Check, ArrowRight, CreditCard, X } from 'lucide-react';
import {api, accessHeaders} from '../../utils/api';
import {useApp} from '../../context/AppContext';
import { Appointment } from '../../types';

const money = (amount: number) => new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0}).format(amount);

export function ApprovedAppointment({appointment, onReturn, onBookAgain}: {appointment: Appointment; onReturn: () => void; onBookAgain: () => void}) {
  const {refreshPatientBooking}=useApp();
  const [paymentConfigured,setPaymentConfigured]=useState(false);
  const [checkoutBusy,setCheckoutBusy]=useState(false);
  const [checkoutError,setCheckoutError]=useState('');
  useEffect(()=>{api<{paymentsConnected:boolean}>('/config').then(c=>setPaymentConfigured(c.paymentsConnected)).catch(()=>{});},[]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const paymentDialog = useRef<HTMLDialogElement>(null);
  const paid = appointment.paymentStatus === 'paid';
  const date = new Date(`${appointment.date}T12:00:00+05:30`).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'});
  const service = appointment.consultingFor || 'Consultation';
  useEffect(() => {
    const dialog = paymentDialog.current;
    if (!paymentOpen || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [paymentOpen]);

  const checkout = async () => {
    setCheckoutBusy(true);setCheckoutError('');
    try {
      const order=await api<{key:string;orderId:string;amount:number;currency:string}>(`/appointments/${appointment.id}/payment/order`,{method:'POST',headers:accessHeaders(appointment.id),body:'{}'});
      if(!(window as any).Razorpay)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=()=>resolve();script.onerror=()=>reject(new Error('Payment checkout could not load. Please retry.'));document.head.appendChild(script);});
      const checkout=new (window as any).Razorpay({key:order.key,order_id:order.orderId,amount:order.amount,currency:order.currency,name:'Dr. Niva Jacob',description:'Online consultation',prefill:{name:appointment.patientName,email:appointment.patientEmail,contact:appointment.patientPhone},theme:{color:'#332b27'},modal:{ondismiss:()=>{setCheckoutBusy(false);setPaymentOpen(true);}},handler:async(response:any)=>{
        try {await api(`/appointments/${appointment.id}/payment/verify`,{method:'POST',headers:accessHeaders(appointment.id),body:JSON.stringify({paymentId:response.razorpay_payment_id,signature:response.razorpay_signature})});await refreshPatientBooking(appointment.id);setPaymentOpen(false);}catch(error){setCheckoutError((error as Error).message);setPaymentOpen(true);}finally{setCheckoutBusy(false);}
      }});
      checkout.on('payment.failed',()=>{setCheckoutError('Payment was not completed. You can try again.');setCheckoutBusy(false);setPaymentOpen(true);});paymentDialog.current?.close();setPaymentOpen(false);checkout.open();
    }catch(error){setCheckoutError((error as Error).message);setCheckoutBusy(false);}
  };

  return <div className="approved-appointment">
    <div className="approved-kicker"><span><Check size={15} aria-hidden="true"/></span> REQUEST APPROVED</div>
    <h2>{paid && appointment.calendarStatus==='synced' ? 'Your appointment is confirmed.' : paid ? 'Payment received.' : 'Your next step,\na little closer to care.'}</h2>
    <p className="approved-intro">{appointment.patientName}, {paid ? appointment.calendarStatus==='synced'?'your payment is complete and your appointment is confirmed in Google Calendar.':appointment.calendarStatus==='conflict'?'your payment is complete, but the calendar slot requires staff review. Please contact the practice.':'your consultation payment is complete. Calendar confirmation will follow once synchronization succeeds.' : 'your request has been approved. Complete payment to confirm your appointment.'}</p>
    <div className="approved-summary">
      <div className="approved-summary-top"><span>{service}</span><span className="approved-online"><Video size={13} aria-hidden="true"/> Online</span></div>
      <div className="approved-summary-date"><span><CalendarDays size={16} aria-hidden="true"/>{date}</span><span><Clock3 size={16} aria-hidden="true"/>{appointment.time} IST</span></div>
      <div className="approved-reference"><span>{appointment.durationMin} minute session</span><span>{appointment.referenceNo}</span></div>
    </div>
    <div className="approved-total"><div><span>{paid ? 'Amount paid' : 'Consultation fee'}</span><small>{paid ? 'Payment complete' : 'Pay after approval'}</small></div><strong>{money(appointment.fee)}</strong></div>
    {!paid && <><button type="button" className="primary approved-pay" onClick={() => setPaymentOpen(true)}><span><CreditCard size={17} aria-hidden="true"/> Pay {money(appointment.fee)}</span><ArrowRight size={17} aria-hidden="true"/></button><p className="approved-payment-note">Your Google Calendar appointment is reserved only after successful payment.</p></>}
    <div className="approved-footer"><button type="button" onClick={onReturn}>Return to website</button><button type="button" onClick={onBookAgain}>Request another appointment</button></div>
    {paymentOpen && <dialog ref={paymentDialog} className="appointment-payment-dialog" aria-labelledby="payment-dialog-title" aria-describedby="payment-dialog-description" onCancel={() => setPaymentOpen(false)} onClose={() => setPaymentOpen(false)} onClick={event => {if(event.target === event.currentTarget) {const rect = event.currentTarget.getBoundingClientRect(); if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setPaymentOpen(false);}}}>
      <div className="payment-dialog-heading"><p className="eyebrow">YOUR CONSULTATION</p><button type="button" aria-label="Close payment popup" onClick={() => setPaymentOpen(false)}><X size={19}/></button></div>
      <h2 id="payment-dialog-title">Complete your payment.</h2>
      <p id="payment-dialog-description" className="payment-dialog-description">Review your appointment before payment.</p>
      <div className="payment-order"><strong>{service}</strong><p>{date} · {appointment.time} IST</p><p>{appointment.durationMin} minutes · Online</p><span>{appointment.referenceNo}</span></div>
      <div className="payment-dialog-total"><span>Total to pay</span><strong>{money(appointment.fee)}</strong></div>
      {!paymentConfigured && <div className="payment-setup-notice" role="status"><CreditCard size={18} aria-hidden="true"/><div><strong>Payment setup pending</strong><p>Live payments are not configured yet. No charge or calendar reservation will be made.</p></div></div>}
      {checkoutError && <p className="error" role="alert">{checkoutError}</p>}
      <button type="button" className={paymentConfigured?'primary':'payment-unavailable'} disabled={!paymentConfigured||checkoutBusy} onClick={checkout}> {checkoutBusy?'Opening checkout…':paymentConfigured?`Pay ${money(appointment.fee)}`:'Live checkout unavailable'}</button>
      <button type="button" className="payment-back" onClick={() => setPaymentOpen(false)}>Back to appointment</button>
    </dialog>}
  </div>;
}
