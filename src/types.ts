export type ServiceType = 
  | 'consultation'
  | 'therapy'
  | 'couples-therapy'
  | 'psychiatric-consultation'
  | 'anxiety'
  | 'attachment-patterns'
  | 'couple-therapy'
  | 'sexual-health'
  | 'personality-patterns'
  | 'life-transitions'
  | 'sexual-problem' 
  | 'relationship-issues' 
  | 'trauma' 
  | 'attachment-styles' 
  | 'personality-related' 
  | 'other'
  | 'initial' 
  | 'followup' 
  | 'online';

export type ConsultationCategory = 'psychiatric' | 'therapy';
export type PatientType = 'new-patient' | 'returning-patient';

export interface Service {
  id: ServiceType;
  name: string;
  category?: ConsultationCategory;
  tagline: string;
  description: string;
  durationMin: number;
  fee: number;
  formattedFee: string;
  focusAreas?: string[];
  badge?: string;
}

export interface ResourceArticle {
  id: string;
  category: 'mental-health' | 'relationships' | 'sexual-health';
  categoryLabel: string;
  title: string;
  subtitle: string;
  readTime: string;
  excerpt: string;
  keyTakeaways: string[];
  content: string[];
  clinicalTip: string;
}

export interface CurlyShrinkPost {
  id: string;
  topic: string;
  quote: string;
  insight: string;
  clinicalAngle: string;
  tag: string;
}

export interface Clinic {
  id: string;
  name: string;
  neighbourhood: string;
  address: string;
  nextAvailable: string;
  hours: string;
  parking: string;
  metro: string;
  image?: string;
}

export type AppointmentStatus = 'upcoming' | 'completed' | 'confirmed' | 'blocked' | 'cancelled';

export interface ClinicalConsultationNote {
  id: string;
  patientEmail: string;
  patientName: string;
  consultationDate: string; // YYYY-MM-DD
  sessionNumber: number;
  sickness: string; // Chief complaint / diagnosis
  mentalStatusExam: string;
  clinicalObservations: string;
  interventionsUsed: string;
  progressAssessment: 'significant_improvement' | 'moderate_progress' | 'stable' | 'needs_adjustment';
  planNextSteps: string;
  createdAt: string;
}

export interface DigitalPrescription {
  id: string;
  prescriptionNumber: string; // e.g. "RX-8842"
  patientEmail: string;
  patientName: string;
  patientAge?: number;
  date: string;
  sicknessDiagnosis: string;
  therapyDirectives: string[]; // homework / psychological directives
  recommendedSupplementsOrMedications: string[]; // supportive care
  dietaryLifestyleRecommendations: string;
  followUpDate: string;
  doctorName: string;
  doctorCredentials: string;
  registrationNumber: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  referenceNo: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge?: number;
  patientType?: PatientType;
  sickness?: string; // e.g. "Severe Nocturnal Panic & Somatic Hyperarousal"
  reason?: string;
  consultingFor?: string;
  serviceId: ServiceType;
  clinicId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (e.g. "10:30")
  durationMin: number;
  status: AppointmentStatus;
  fee: number;
  notes?: string;
  history?: Array<{
    date: string;
    type: string;
    summary: string;
  }>;
  createdAt: string;
}

export interface DayAvailability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  enabled: boolean;
  clinicId: string;
  startTime: string; // "09:00"
  endTime: string;   // "13:00"
  slotDurationMin: number;
}

export interface BlockedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  clinicId?: string;
  reason: string;
}

export type AppView = 'patient-home' | 'patient-booking' | 'admin' | 'admin-login';

export type AdminTab = 
  | 'overview' 
  | 'schedule' 
  | 'appointments' 
  | 'patients' 
  | 'availability' 
  | 'consultations'
  | 'therapy'
  | 'locations'
  | 'resources'
  | 'the-curly-shrink'
  | 'website'
  | 'notifications'
  | 'settings';
