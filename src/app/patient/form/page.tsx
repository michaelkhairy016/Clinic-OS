"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Send, MapPin, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PatientForm() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Reference Data
  const [districts, setDistricts] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [prevDoc, setPrevDoc] = useState('');
  const [prevMeds, setPrevMeds] = useState<string[]>([]);
  const [isVezeeta, setIsVezeeta] = useState(false);
  const [chronic, setChronic] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [dRes, sRes, mRes] = await Promise.all([
        supabase.from('districts').select('*').order('name_ar'),
        supabase.from('referral_sources').select('*').order('name_ar'),
        supabase.from('medication_master').select('*').order('trade_name_en'),
      ]);
      setDistricts(dRes.data || []);
      setSources(sRes.data || []);
      setMedications(mRes.data || []);
    };
    fetchData();
  }, [supabase]);

  const t = {
    title: lang === 'ar' ? 'استمارة بيانات المريض' : 'Patient Intake Form',
    subtitle: lang === 'ar' ? 'يرجى ملء البيانات التالية قبل الدخول للعيادة' : 'Please fill the following before your session',
    notice: lang === 'ar' ? '⚠️ فضلاً، يتم ملء هذه الاستمارة مــرة واحدة فقط. في المرة القادمة سيقوم المساعد بالبحث عن اسمك في الأرشيف.' : '⚠️ Please fill this form ONCE only. For future visits, the assistant will find your name in our archive.',
    name: lang === 'ar' ? 'الاسم الثلاثي بالكامل *' : 'Full Name (Triple) *',
    age: lang === 'ar' ? 'السن *' : 'Age *',
    phone: lang === 'ar' ? 'رقم الموبايل *' : 'Mobile Number *',
    district: lang === 'ar' ? 'منطقة السكن *' : 'Living Area *',
    source: lang === 'ar' ? 'عرفت العيادة عن طريق؟ *' : 'How did you hear about us? *',
    vezeeta: lang === 'ar' ? 'تم الحجز عن طريق فيزيتا؟' : 'Booked via Vezeeta?',
    firstVisit: lang === 'ar' ? 'هل هذه أول مرة لزيارة طبيب نفسي؟' : 'Is this your first time visiting a psychiatrist?',
    prevDoc: lang === 'ar' ? 'اسم الطبيب السابق (اختياري)' : 'Previous Doctor\'s Name (Optional)',
    prevMeds: lang === 'ar' ? 'أدوية نفسية استخدمتها سابقاً (اختياري)' : 'Previous Psychiatric Medications (Optional)',
    chronic: lang === 'ar' ? 'هل تعاني من أمراض مزمنة أو حساسية؟' : 'Any chronic diseases or allergies?',
    submit: lang === 'ar' ? 'تسجيل البيانات' : 'Register My Data',
    successMsg: lang === 'ar' ? 'تم تسجيل البيانات بنجاح! تفضل بالجلوس وسيقوم المساعد بنداء اسمك.' : 'Registration Successful! Please wait for your turn.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Logic for new patient registration
      const { data: pData, error: pErr } = await supabase.from('patients').insert({
        full_name: fullName,
        age: Number(age),
        phone,
        district_id: districtId || null,
        referral_source_id: sourceId || null,
        is_first_psych_visit: isFirstVisit,
        previous_doctor: prevDoc,
        is_vezeeta: isVezeeta,
        chronic_history: chronic
      }).select().single();

      if (pErr) throw pErr;

      // Handle medications relation
      if (prevMeds.length > 0) {
        const medInserts = prevMeds.map(mId => ({ patient_id: pData.id, medication_id: mId }));
        await supabase.from('patient_previous_meds').insert(medInserts);
      }
      setSuccess(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f8f8', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 450, textAlign: 'center', padding: '3.5rem' }}>
           <CheckCircle2 size={80} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
           <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{lang === 'ar' ? 'تم التسجيل بنجاح' : 'Success!'}</h2>
           <p style={{ color: 'var(--text-medium)', fontSize: '1.2rem', lineHeight: 1.6 }}>{t.successMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#f5f8f8', padding: '1rem 1rem 3rem 1rem' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 800 }}>Dr. Amgad Khairy Clinic</h1>
          </div>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="btn btn-secondary">
             <Globe size={18} /> {lang === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>

        <div className="card shadow-sm" style={{ borderTop: '6px solid var(--primary)', borderRadius: '24px' }}>
          <div style={{ background: '#fff9db', padding: '1rem', borderRadius: '12px', border: '1px solid #ffe066', display: 'flex', gap: '12px', marginBottom: '2rem' }}>
             <AlertCircle size={24} style={{ color: '#f08c00', flexShrink: 0 }} />
             <p style={{ margin: 0, fontWeight: 800, color: '#856404', lineHeight: 1.5 }}>{t.notice}</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
             <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>{t.title}</h2>
             <p style={{ color: 'var(--text-light)', margin: 0 }}>{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 100px', gap: '1rem' }}>
                <div>
                   <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>{t.name}</label>
                   <input required value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>{t.age}</label>
                   <input required type="number" value={age} onChange={e => setAge(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} />
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                   <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}><MapPin size={16}/> {t.district}</label>
                   <select required value={districtId} onChange={e => setDistrictId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <option value="">-- {lang === 'ar' ? 'اختر المنطقة' : 'Select District'} --</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{lang === 'ar' ? d.name_ar : d.name_en}</option>)}
                   </select>
                </div>
                <div>
                   <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>{t.phone}</label>
                   <input required value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} />
                </div>
             </div>

             <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>{t.source}</label>
                <select required value={sourceId} onChange={e => setSourceId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                   <option value="">-- {lang === 'ar' ? 'اختر المصدر' : 'Select Source'} --</option>
                   {sources.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>)}
                </select>
             </div>

             <div className="card" style={{ background: '#f8f9fa', border: isVezeeta ? '2px solid var(--primary)' : '1px solid var(--border)', cursor: 'pointer', padding: '1rem' }} onClick={() => setIsVezeeta(!isVezeeta)}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 800, color: 'var(--primary)' }}>
                   <input type="checkbox" checked={isVezeeta} onChange={() => {}} style={{ width: '20px', height: '20px' }} />
                   {t.vezeeta}
                </label>
             </div>

             <div style={{ background: '#f8f9fa', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', cursor: 'pointer', fontWeight: 600 }}>
                   <input type="checkbox" checked={!isFirstVisit} onChange={() => setIsFirstVisit(!isFirstVisit)} style={{ width: '20px', height: '20px' }} />
                   {t.firstVisit}
                </label>

                {!isFirstVisit && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s' }}>
                      <input placeholder={t.prevDoc} value={prevDoc} onChange={e => setPrevDoc(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }} />
                      
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>{t.prevMeds}</label>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'white', border: '1px solid var(--border)', borderRadius: '10px' }}>
                         {medications.map(m => (
                            <div 
                              key={m.id} 
                              onClick={() => setPrevMeds(prevMeds.includes(m.id) ? prevMeds.filter(x => x !== m.id) : [...prevMeds, m.id])}
                              style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', background: prevMeds.includes(m.id) ? 'var(--primary)' : '#f1f3f5', color: prevMeds.includes(m.id) ? 'white' : 'inherit' }}
                            >
                               {m.trade_name_en}
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>

             <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>{t.chronic}</label>
                <textarea value={chronic} onChange={e => setChronic(e.target.value)} rows={2} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit' }} />
             </div>

             <button disabled={loading} className="btn btn-primary" style={{ padding: '1.25rem', fontSize: '1.2rem', borderRadius: '16px', marginTop: '1rem' }}>
                {loading ? <Loader2 className="spinner"/> : <Send size={20}/>} {t.submit}
             </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
