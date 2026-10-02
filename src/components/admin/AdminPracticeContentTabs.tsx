import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AdminTab, 
  Service, 
  ResourceArticle 
} from '../../types';
import { 
  SERVICES, 
  DOCTOR_INFO, 
  RESOURCE_ARTICLES, 
  CURLY_SHRINK_POSTS,
  CLINICS 
} from '../../data/initialData';
import { 
  Video, 
  Clock, 
  Tag, 
  Check, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  Instagram, 
  Youtube, 
  Settings as SettingsIcon, 
  Bell, 
  ShieldCheck, 
  Plus,
  ArrowRight
} from 'lucide-react';

interface Props {
  tab: AdminTab;
}

export const AdminPracticeContentTabs: React.FC<Props> = ({ tab }) => {
  const { setActiveView, openBooking } = useApp();

  if (tab === 'consultations') {
    const consultation = SERVICES.find(s => s.id === 'consultation') || SERVICES[0];
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">Practice Management</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">Consultation Services</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">Configured intake assessment fees, durations, and booking slots.</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#332B27]/10 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-[#332B27]/10">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#B89552] block mb-1">
                Primary Assessment
              </span>
              <h3 className="font-editorial text-2xl text-[#332B27]">{consultation.name}</h3>
              <p className="text-xs text-[#332B27]/70 mt-1">{consultation.tagline}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-semibold font-mono-tabular text-[#332B27]">₹1,500</span>
              <p className="text-xs text-[#332B27]/50 font-mono-tabular">20 minutes duration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/5 space-y-1">
              <p className="font-semibold text-[#332B27]">Care Objective</p>
              <p className="text-[#332B27]/70 leading-relaxed">
                A first step towards understanding what the patient is going through. Assessment for therapy direction or psychiatric evaluation.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/5 space-y-1">
              <p className="font-semibold text-[#332B27]">Teletherapy Format</p>
              <p className="text-[#332B27]/70 leading-relaxed">
                100% online encrypted HD video session. Automatic patient link generation upon booking confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'therapy') {
    const therapyList = SERVICES.filter(s => s.id !== 'consultation');
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">Practice Management</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">Therapy Modalities</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">Specialized psychotherapy tracks for individual and couple care.</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#332B27]/10 divide-y divide-[#332B27]/10 shadow-xs overflow-hidden">
          {therapyList.map((th) => (
            <div key={th.id} className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F0]/30 transition-colors">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="font-editorial text-2xl text-[#332B27]">{th.name}</span>
                  {th.id === 'couple-therapy' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F1E3A6] text-[#332B27] border border-[#B89552]/30">
                      75 Min Couple
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#332B27]/70 leading-relaxed">{th.description}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xl font-semibold font-mono-tabular text-[#332B27] block">
                  {th.formattedFee}
                </span>
                <span className="text-xs text-[#332B27]/50 font-mono-tabular">
                  {th.durationMin} minutes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'locations') {
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">Practice Management</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">Practice Locations</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">Virtual telehealth suite and confidential consultation environments.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CLINICS.map(clinic => (
            <div key={clinic.id} className="p-6 rounded-3xl bg-white border border-[#332B27]/10 space-y-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F1E3A6] flex items-center justify-center text-[#332B27]">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-2xl text-[#332B27]">{clinic.name}</h3>
                <p className="text-xs text-[#B89552] font-semibold uppercase tracking-wider mt-1">{clinic.neighbourhood}</p>
                <p className="text-xs text-[#332B27]/70 mt-2">{clinic.address}</p>
              </div>
              <div className="pt-3 border-t border-[#332B27]/10 text-xs text-[#332B27]/60 space-y-1 font-mono-tabular">
                <p>Hours: {clinic.hours}</p>
                <p>Coverage: {clinic.metro}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'resources') {
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">Content Engine</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">Resources & SEO Library</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">Foundation of the psychoeducational content system across 3 categories.</p>
        </div>

        <div className="space-y-4">
          {RESOURCE_ARTICLES.map((art) => (
            <div key={art.id} className="p-6 rounded-2xl bg-white border border-[#332B27]/10 hover:border-[#B89552]/40 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B89552]">
                  {art.categoryLabel} · {art.readTime}
                </span>
                <h3 className="font-editorial text-xl text-[#332B27]">{art.title}</h3>
                <p className="text-xs text-[#332B27]/70 line-clamp-1">{art.excerpt}</p>
              </div>
              <div className="text-xs text-[#332B27]/50 font-mono-tabular shrink-0">
                SEO Indexed
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'the-curly-shrink') {
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">Brand & Creator Content</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">The Curly Shrink</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">
            "Mental health, sexual health and relationship conversations — made simpler, more relatable and easier to talk about."
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#F1E3A6] text-[#332B27] space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-editorial italic text-2xl">@thecurlyshrink</span>
            <div className="flex items-center gap-2">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1 rounded-full bg-white/80 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram ↗</span>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1 rounded-full bg-white/80 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube ↗</span>
              </a>
            </div>
          </div>
          <p className="text-sm text-[#332B27]/80 leading-relaxed max-w-xl">
            Humanizing clinical psychiatry, sexual health, and intimacy through engaging short-form video reels and relatable analogies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CURLY_SHRINK_POSTS.slice(0, 3).map((post) => (
            <div key={post.id} className="p-5 rounded-2xl bg-white border border-[#332B27]/10 space-y-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B89552]">{post.topic}</span>
              <p className="font-editorial italic text-lg text-[#332B27] leading-snug">"{post.quote}"</p>
              <p className="text-xs text-[#332B27]/70 leading-relaxed">{post.insight}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'website') {
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">Digital Presence</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">Patient Website Configuration</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">Live status of the public personal brand and appointment engine.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#332B27]/10 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-editorial text-2xl text-[#332B27]">{DOCTOR_INFO.name}</p>
              <p className="text-xs text-[#332B27]/60">{DOCTOR_INFO.title}</p>
            </div>
            <button
              onClick={() => setActiveView('patient-home')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F0] border border-[#332B27]/10 hover:border-[#B89552] text-xs font-semibold text-[#332B27] transition-all cursor-pointer"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#332B27]/10 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF7F0]">
              <p className="font-semibold text-[#332B27]">Brand Identity</p>
              <p className="text-[#332B27]/60 mt-0.5">Warm Ivory, Butter Yellow, Deep Cocoa</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF7F0]">
              <p className="font-semibold text-[#332B27]">Typography</p>
              <p className="text-[#332B27]/60 mt-0.5">Cormorant Garamond & Manrope</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF7F0]">
              <p className="font-semibold text-[#332B27]">Intake Triage</p>
              <p className="text-[#332B27]/60 mt-0.5">New vs Returning Patient Split Flow</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'notifications') {
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">System</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">Practice Notifications</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">Alerts for new bookings, schedule changes, and telehealth sessions.</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#332B27]/10 divide-y divide-[#332B27]/10 shadow-xs">
          <div className="p-5 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#AAB39A] mt-2 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#332B27]">New Patient Booked: Ananya</p>
              <p className="text-xs text-[#332B27]/70 mt-0.5">Consultation (20 min) · Today at 10:00 AM IST</p>
              <p className="text-[10px] text-[#332B27]/50 font-mono-tabular mt-1">Received 15 mins ago</p>
            </div>
          </div>
          <div className="p-5 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#B89552] mt-2 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#332B27]">Returning Session Rebooked: Rahul</p>
              <p className="text-xs text-[#332B27]/70 mt-0.5">Therapy • Anxiety (50 min) · Today at 09:00 AM IST</p>
              <p className="text-[10px] text-[#332B27]/50 font-mono-tabular mt-1">Received 1 hour ago</p>
            </div>
          </div>
          <div className="p-5 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#332B27]/20 mt-2 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#332B27]">Administrative Slot Reserved</p>
              <p className="text-xs text-[#332B27]/70 mt-0.5">10:30 AM BLOCKED for clinical case preparation</p>
              <p className="text-[10px] text-[#332B27]/50 font-mono-tabular mt-1">Scheduled by Dr. Niva</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'settings') {
    return (
      <div className="space-y-6 max-w-4xl font-sans-clean">
        <div className="border-b border-[#332B27]/10 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B89552]">System</p>
          <h2 className="font-editorial text-3xl text-[#332B27] font-normal">Settings & Compliance</h2>
          <p className="text-sm text-[#332B27]/60 mt-1">Clinical credentials, medical registry records, and telehealth protocols.</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#332B27]/10 p-6 sm:p-8 space-y-6 shadow-xs text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F0]">
              <p className="font-bold text-[#332B27]">Doctor Name</p>
              <p className="text-[#332B27]/70 mt-1">{DOCTOR_INFO.name}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F0]">
              <p className="font-bold text-[#332B27]">Medical Registration</p>
              <p className="text-[#332B27]/70 mt-1">{DOCTOR_INFO.registrationNo}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F0]">
              <p className="font-bold text-[#332B27]">Primary Qualifications</p>
              <p className="text-[#332B27]/70 mt-1">{DOCTOR_INFO.qualifications}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F0]">
              <p className="font-bold text-[#332B27]">Telehealth Encryption</p>
              <p className="text-[#332B27]/70 mt-1">End-to-End Encrypted WebRTC · HIPAA Compliant</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
