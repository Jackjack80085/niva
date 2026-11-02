import React, { useState } from 'react';
import { PatientNav } from './PatientNav';
import { HeroSection } from './HeroSection';
import { IntroductionSection } from './IntroductionSection';
import { ExpertiseSection } from './ExpertiseSection';
import { ConsultationsSection } from './ConsultationsSection';
import { TheCurlyShrinkSection } from './TheCurlyShrinkSection';
import { CredibilityNumbersSection } from './CredibilityNumbersSection';
import { DoctorStory } from './DoctorStory'; // Professional Background
import { FAQSection } from './FAQSection';
import { FinalBookingCta } from './FinalBookingCta';
import { PatientFooter } from './PatientFooter';
import { useApp } from '../../context/AppContext';
import { Calendar, ArrowRight, Search, CheckCircle2, Clock3 } from 'lucide-react';

export const PatientHome: React.FC = () => {
  const { openBooking, lookupAppointmentByContact } = useApp();
  const [statusLookup, setStatusLookup] = useState({ name: '', email: '', phone: '' });
  const [lookupResult, setLookupResult] = useState<{ status: string; message: string } | null>(null);

  const handleStatusCheck = (event: React.FormEvent) => {
    event.preventDefault();
    const record = lookupAppointmentByContact(statusLookup.name, statusLookup.email, statusLookup.phone);

    if (!record) {
      setLookupResult({
        status: 'not-found',
        message: 'No matching request was found. Please check your details or submit a new appointment request.'
      });
      return;
    }

    if (record.status === 'pending') {
      setLookupResult({
        status: 'pending',
        message: 'Your request is still under review by the doctor. Payment stays blocked until approval.'
      });
      return;
    }

    if (record.status === 'confirmed' || record.status === 'upcoming') {
      setLookupResult({
        status: 'approved',
        message: `Your appointment has been approved. You can return and complete payment for ${record.consultingFor || record.serviceId}.`
      });
      return;
    }

    if (record.status === 'rejected') {
      setLookupResult({
        status: 'rejected',
        message: 'This request was not approved for the selected time. Please contact the clinic to discuss an alternative slot.'
      });
      return;
    }

    setLookupResult({
      status: record.status,
      message: `Current status: ${record.status}.`
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#332B27] flex flex-col selection:bg-[#F1E3A6] selection:text-[#332B27] texture-paper">
      <PatientNav />

      <main className="flex-1 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
        <HeroSection />
        <IntroductionSection />
        <ExpertiseSection />
        <ConsultationsSection />
        <TheCurlyShrinkSection />
        <CredibilityNumbersSection />
        <DoctorStory />

        <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="rounded-[28px] border border-[#e5d8bf] bg-[#fffdf9] p-6 shadow-[0_10px_30px_rgba(51,43,39,0.04)] md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-[#F1E3A6] p-2 text-[#332B27]">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B89552]">Check status</p>
                <h2 className="font-editorial text-3xl text-[#332B27]">Appointment status</h2>
              </div>
            </div>

            <form onSubmit={handleStatusCheck} className="grid gap-4 md:grid-cols-3">
              <label className="text-xs font-medium uppercase tracking-[0.15em] text-[#6E5D4C]">
                Full name
                <input
                  value={statusLookup.name}
                  onChange={(e) => setStatusLookup((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 block w-full rounded-xl border border-[#e1d3bc] bg-[#fbf8f2] p-3 text-sm text-[#332B27] outline-none focus:border-[#b99d63] focus:ring-2 focus:ring-[#d7bf7e]/40"
                  placeholder="Your full name"
                  required
                />
              </label>

              <label className="text-xs font-medium uppercase tracking-[0.15em] text-[#6E5D4C]">
                Email
                <input
                  type="email"
                  value={statusLookup.email}
                  onChange={(e) => setStatusLookup((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-2 block w-full rounded-xl border border-[#e1d3bc] bg-[#fbf8f2] p-3 text-sm text-[#332B27] outline-none focus:border-[#b99d63] focus:ring-2 focus:ring-[#d7bf7e]/40"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="text-xs font-medium uppercase tracking-[0.15em] text-[#6E5D4C]">
                Phone number
                <input
                  value={statusLookup.phone}
                  onChange={(e) => setStatusLookup((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-2 block w-full rounded-xl border border-[#e1d3bc] bg-[#fbf8f2] p-3 text-sm text-[#332B27] outline-none focus:border-[#b99d63] focus:ring-2 focus:ring-[#d7bf7e]/40"
                  placeholder="+91 98765 43210"
                  required
                />
              </label>
            </form>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleStatusCheck}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#332B27] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#FAF7F0] shadow-sm transition hover:opacity-95"
              >
                <Search className="h-4 w-4" />
                Check status
              </button>

              <button
                type="button"
                onClick={() => openBooking()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8cba8] bg-[#f8f1e2] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#332B27] transition hover:bg-[#f2e8d0]"
              >
                <Calendar className="h-4 w-4" />
                Book again
              </button>
            </div>

            {lookupResult && (
              <div className={`mt-6 rounded-2xl border p-4 ${lookupResult.status === 'approved' ? 'border-[#d3e3d2] bg-[#eef7ee]' : lookupResult.status === 'pending' ? 'border-[#ead7a5] bg-[#faf3dc]' : lookupResult.status === 'rejected' ? 'border-[#ebd0c8] bg-[#fdf1ee]' : 'border-[#e9e1d4] bg-[#f7f5f1]'}`}>
                <div className="flex items-start gap-3">
                  {lookupResult.status === 'approved' ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#436d46]" />
                  ) : lookupResult.status === 'pending' ? (
                    <Clock3 className="mt-0.5 h-5 w-5 text-[#8b6b2d]" />
                  ) : (
                    <Search className="mt-0.5 h-5 w-5 text-[#6E5D4C]" />
                  )}
                  <p className="text-sm leading-6 text-[#332B27]">{lookupResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <FAQSection />
        <FinalBookingCta />
        <PatientFooter />
      </main>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#332B27]/12 shadow-lg">
        <button
          onClick={() => openBooking()}
          className="w-full py-3.5 px-4 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] transition-transform"
        >
          <Calendar className="w-4 h-4 text-[#F1E3A6]" />
          <span>Book appointment with Dr. Niva</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#F1E3A6]" />
        </button>
      </div>
    </div>
  );
};
