"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Send, User, Building2, Briefcase, Pill, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function MRIntakeForm() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Reference Data
  const [companies, setCompanies] = useState<any[]>([]);
  const [medicalLines, setMedicalLines] = useState<any[]>([]);

  // Form Fields
  const [mrName, setMrName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [otherCompany, setOtherCompany] = useState('');
  
  const [lineId, setLineId] = useState('');
  const [otherLine, setOtherLine] = useState('');
  
  const [promotedMeds, setPromotedMeds] = useState('');
  const [notes, setNotes] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [cRes, lRes] = await Promise.all([
        supabase.from('pharma_companies').select('*').order('name_en'),
        supabase.from('medical_lines').select('*').order('name_en'),
      ]);
      setCompanies(cRes.data || []);
      setMedicalLines(lRes.data || []);
    };
    fetchData();
  }, [supabase]);

  const t = {
    title: lang === 'ar' ? 'استمارة زيارة مندوبي الدعاية' : 'Medical Representative Visit Log',
    subtitle: lang === 'ar' ? 'يرجى تسجيل بيانات الزيارة' : 'Please record your visit details',
    mrName: lang === 'ar' ? 'اسم المندوب *' : 'Your Full Name *',
    company: lang === 'ar' ? 'الشركة *' : 'Pharma Company *',
    otherCompany: lang === 'ar' ? 'اكتب اسم الشركة هنا' : 'Type Company Name Here',
    line: lang === 'ar' ? 'القسم / التخصص' : 'Medical Line / Specialty',
    otherLine: lang === 'ar' ? 'اكتب التخصص هنا' : 'Type Specialty Here',
    meds: lang === 'ar' ? 'الأدوية الجديدة التي تروج لها' : 'New Medicines you are launching/representing',
    notes: lang === 'ar' ? 'أي ملاحظات إضافية' : 'Any additional notes',
    submit: lang === 'ar' ? 'إرسال البيانات' : 'Submit Visit Log',
    success: lang === 'ar' ? 'تم تسجيل الزيارة بنجاح!' : 'Visit Recorded!',
    wait: lang === 'ar' ? 'شكراً لزيارتكم لعيادة د. أمجد خيري كامل' : 'Thank you for visiting Dr. Amgad Khairy Kamel\'s Clinic',
    other: lang === 'ar' ? 'أخرى (غير موجود بالقائمة)' : 'Other (Not in list)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('mr_visits').insert({
        mr_name: mrName,
        pharma_company_id: companyId === 'other' ? null : (companyId || null),
        other_company_name: companyId === 'other' ? otherCompany : null,
        medical_line_id: lineId === 'other' ? null : (lineId || null),
        other_line_name: lineId === 'other' ? otherLine : null,
        promoted_meds: promotedMeds,
        notes: notes
      });
      if (error) alert(error.message);
      else setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f8f8', padding: '2rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 450, padding: '3rem' }}>
           <CheckCircle2 size={72} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
           <h2 style={{ color: 'var(--primary)', fontWeight: 800 }}>{t.success}</h2>
           <p style={{ color: 'var(--text-medium)', marginTop: '1rem', fontSize: '1.2rem' }}>{t.wait}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#f5f8f8', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>Clinic-OS Support</h1>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="btn btn-secondary">
             <Globe size={18} /> {lang === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>

        <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
             <Building2 size={40} style={{ color: 'var(--primary)', margin: '0 auto 10px' }} />
             <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>{t.title}</h2>
             <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t.mrName}</label>
              <input required type="text" value={mrName} onChange={(e) => setMrName(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'block', fontWeight: 600 }}>{t.company}</label>
              <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                 <option value="">-- {lang === 'ar' ? 'اختر الشركة' : 'Select Company'} --</option>
                 {companies.map(c => (
                   <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : (c.name_en || c.name_ar)}</option>
                 ))}
                 <option value="other">{t.other}</option>
              </select>
              {companyId === 'other' && (
                <input required placeholder={t.otherCompany} value={otherCompany} onChange={(e) => setOtherCompany(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--primary)', background: '#f5f8f8' }} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'block', fontWeight: 600 }}>{t.line}</label>
              <select value={lineId} onChange={(e) => setLineId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <option value="">-- {lang === 'ar' ? 'اختر القسم' : 'Select Line'} --</option>
                {medicalLines.map(l => (
                  <option key={l.id} value={l.id}>{lang === 'ar' ? l.name_ar : (l.name_en || l.name_ar)}</option>
                ))}
                <option value="other">{t.other}</option>
              </select>
              {lineId === 'other' && (
                <input required placeholder={t.otherLine} value={otherLine} onChange={(e) => setOtherLine(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--primary)', background: '#f5f8f8' }} />
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t.meds}</label>
              <textarea placeholder={lang === 'ar' ? 'اكتب أسماء الأدوية هنا الفردية...' : 'Type drug names here...'} rows={2} value={promotedMeds} onChange={(e) => setPromotedMeds(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t.notes}</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit' }} />
            </div>

            <button disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', marginTop: '1rem', fontSize: '1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
               {loading ? <Loader2 className="spinner" /> : <><Send size={20}/> {t.submit}</>}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>د. أمجد خيري كامل - Dr. Amgad Khairy Kamel</p>
          </form>
        </div>
      </div>
    </div>
  );
}
