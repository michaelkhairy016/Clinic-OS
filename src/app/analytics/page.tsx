"use client";

import React, { useState } from 'react';
import { 
   BarChart, Users, TrendingUp, Clock, ShieldAlert, 
   Award, HeartPulse, Stethoscope, ChevronUp, ChevronDown, Monitor 
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';

export default function AnalyticsPage() {
  const { role } = useAuth();
  const isDoc = role === 'doctor';
  const [view, setView] = useState<'marketing' | 'performance'>(isDoc ? 'performance' : 'marketing');

  return (
    <div>
      <div className="flex-between">
         <h2>{isDoc ? 'Clinic Intelligence & Analytics' : 'الأداء والتحليلات التسويقية'}</h2>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
         {isDoc && (
           <button className={`btn ${view === 'performance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('performance')}>
              Clinical Performance Hub
           </button>
         )}
         <button className={`btn ${view === 'marketing' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('marketing')}>
            {isDoc ? 'Marketing & Acquisition' : 'تحليلات الاستحواذ والتسويق'}
         </button>
      </div>

      {view === 'performance' && isDoc && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', textAlign: 'left' }}>
            
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
               <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '50%' }}>
                  <Users size={28} />
               </div>
               <div>
                  <h4 style={{ margin: 0, color: 'var(--text-medium)', fontSize: '0.9rem' }}>Monthly Volume</h4>
                  <h2 style={{ margin: '5px 0', color: 'var(--text-dark)' }}>645 Visits</h2>
                  <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <ChevronUp size={16}/> +12% from last month
                  </div>
               </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
               <div style={{ background: 'var(--accent)', color: 'white', padding: '1rem', borderRadius: '50%' }}>
                  <Clock size={28} />
               </div>
               <div>
                  <h4 style={{ margin: 0, color: 'var(--text-medium)', fontSize: '0.9rem' }}>Avg. Wait Time</h4>
                  <h2 style={{ margin: '5px 0', color: 'var(--text-dark)' }}>12 mins</h2>
                  <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <ChevronDown size={16}/> -3 mins improved
                  </div>
               </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
               <div style={{ background: 'var(--secondary)', color: 'white', padding: '1rem', borderRadius: '50%' }}>
                  <HeartPulse size={28} />
               </div>
               <div>
                  <h4 style={{ margin: 0, color: 'var(--text-medium)', fontSize: '0.9rem' }}>Patient Retention</h4>
                  <h2 style={{ margin: '5px 0', color: 'var(--text-dark)' }}>86%</h2>
                  <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <ChevronUp size={16}/> High stability index
                  </div>
               </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 2' }}>
               <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                 <h3 style={{ margin: 0, color: 'var(--primary)' }}>Patient Load (6-Month Trend)</h3>
                 <span className="badge badge-active">Active</span>
               </div>
               
               <div style={{ height: '240px', background: '#fafcfc', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'flex-end', padding: '1rem', gap: '12px' }}>
                  {[210, 320, 290, 480, 520, 645].map((val, i) => {
                     const heightPercentage = (val / 700) * 100;
                     return (
                       <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', gap: '8px' }}>
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-medium)', fontWeight: 600 }}>{val}</span>
                         <div style={{ width: '100%', background: 'linear-gradient(to top, var(--primary), var(--secondary))', height: `${heightPercentage}%`, borderRadius: '4px 4px 0 0', opacity: 0.85, transition: 'height 1s ease' }} />
                       </div>
                     )
                  })}
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: 'var(--text-light)', fontWeight: 600, padding: '0 1rem' }}>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
               </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 1' }}>
               <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)' }}>Top Prescribed Categories</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                 <div>
                   <div className="flex-between" style={{ marginBottom: '5px' }}>
                     <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>SSRIs (Antidepressants)</strong>
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>45%</span>
                   </div>
                   <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px' }}>
                     <div style={{ width: '45%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                   </div>
                 </div>
                 
                 <div>
                   <div className="flex-between" style={{ marginBottom: '5px' }}>
                     <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>Atypical Antipsychotics</strong>
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>30%</span>
                   </div>
                   <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px' }}>
                     <div style={{ width: '30%', height: '100%', background: 'var(--secondary)', borderRadius: '4px' }} />
                   </div>
                 </div>

                 <div>
                   <div className="flex-between" style={{ marginBottom: '5px' }}>
                     <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>Mood Stabilizers</strong>
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>15%</span>
                   </div>
                   <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px' }}>
                     <div style={{ width: '15%', height: '100%', background: 'var(--accent)', borderRadius: '4px' }} />
                   </div>
                 </div>

                 <div>
                   <div className="flex-between" style={{ marginBottom: '5px' }}>
                     <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>Benzodiazepines</strong>
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>10%</span>
                   </div>
                   <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px' }}>
                     <div style={{ width: '10%', height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                   </div>
                 </div>
               </div>
            </div>
         </div>
      )}

      {view === 'marketing' && (
         <div dir={isDoc ? 'ltr' : 'rtl'}>
            <div className="card" style={{ background: '#fff0f0', border: '1px solid #df4759', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '16px', alignItems: 'center' }}>
               <ShieldAlert size={32} color="#df4759" />
               <div>
                 <h3 style={{ margin: '0 0 5px 0', color: '#df4759', fontSize: '1.1rem' }}>{isDoc ? 'Privacy Firewall Active' : 'جدار الحماية مفعل (Privacy Firewall)'}</h3>
                 <p style={{ margin: 0, color: '#df4759', fontSize: '0.95rem' }}>
                    {isDoc ? 'This dashboard only contains anonymized demographic data. Patient PII is completely stripped.' : 'جميع البيانات الظاهرة في هذه الشاشة مخفية الهوية لحماية تفاصيل المريض الطبية والشخصية.'}
                 </p>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
               <div className="card">
                  <h3 style={{ margin: '0 0 1.5rem', color: 'var(--primary)', textAlign: isDoc ? 'left' : 'right' }}>{isDoc ? 'Geographic Distribution' : 'التوزيع الجغرافي (District)'}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                       <strong style={{ color: 'var(--text-dark)' }}>{isDoc ? 'Nasr City' : 'مدينة نصر'}</strong> <span className="badge badge-active">35%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                       <strong style={{ color: 'var(--text-dark)' }}>{isDoc ? 'New Cairo' : 'التجمع الخامس'}</strong> <span className="badge" style={{ background: '#e2ebeb' }}>25%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                       <strong style={{ color: 'var(--text-dark)' }}>{isDoc ? 'Heliopolis' : 'مصر الجديدة'}</strong> <span className="badge" style={{ background: '#e2ebeb' }}>20%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
                       <strong style={{ color: 'var(--text-dark)' }}>{isDoc ? 'Other Districts' : 'مناطق أخرى'}</strong> <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>20%</span>
                    </div>
                  </div>
               </div>

               <div className="card">
                  <h3 style={{ margin: '0 0 1.5rem', color: 'var(--primary)', textAlign: isDoc ? 'left' : 'right' }}>{isDoc ? 'Referral Sources (Patient Intake Form)' : 'مصادر الإحالة (من استمارة المرضى)'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                     
                     <div style={{ background: '#e8f4fd', border: '1px solid #b6dcf9', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Monitor size={28} color="#1877F2" style={{ margin: '0 auto' }} />
                        <strong style={{ fontSize: '1rem', color: '#1877F2' }}>{isDoc ? 'Facebook' : 'فيسبوك'}</strong>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3332' }}>40%</span>
                     </div>
                     
                     <div style={{ background: '#fce8e6', border: '1px solid #f6babb', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#EA4335', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: 'bold' }}>G</div>
                        <strong style={{ fontSize: '1rem', color: '#EA4335' }}>{isDoc ? 'Google' : 'بحث جوجل'}</strong>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3332' }}>25%</span>
                     </div>

                     <div style={{ background: '#e6f6ee', border: '1px solid #b3e6cd', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#00B56A', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: 'bold' }}>V</div>
                        <strong style={{ fontSize: '1rem', color: '#00B56A' }}>{isDoc ? 'Vezeeta' : 'فيزيتا'}</strong>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3332' }}>15%</span>
                     </div>

                     <div style={{ background: '#fef3e6', border: '1px solid #fbdcba', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Users size={28} color="#f59e0b" style={{ margin: '0 auto' }} />
                        <strong style={{ fontSize: '1rem', color: '#f59e0b' }}>{isDoc ? 'Friend' : 'ترشيح صديق'}</strong>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3332' }}>15%</span>
                     </div>

                     <div style={{ background: '#f5f8f8', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-medium)', marginTop: '38px' }}>{isDoc ? 'Other' : 'أخرى'}</strong>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3332' }}>5%</span>
                     </div>

                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
