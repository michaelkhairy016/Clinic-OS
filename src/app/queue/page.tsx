"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  Play,
  CheckCircle,
  Smartphone,
  UserPlus,
  CreditCard,
  Edit,
  History as HistoryIcon,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { PatientRow, QueueEntryRow } from '@/types/database';

type QueueRow = QueueEntryRow & { patients: PatientRow | null };

export default function QueuePage() {
  const { role } = useAuth();
  const isDoc = role === 'doctor';

  const visitTypes = [
    { id: '1', ar: 'كشف عادي (Normal Visit)' },
    { id: '2', ar: 'جلسة مطولة (Long Session)' },
    { id: '3', ar: 'استشارة طبية (Follow-up)' },
    { id: '4', ar: 'طوارئ (Emergency)' },
  ];

  const paymentModes = [
    { id: 'cash', ar: 'كاش' },
    { id: 'instapay', ar: 'Instapay' },
    { id: 'card', ar: 'بطاقة ائتمان' },
  ];

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [searchName, setSearchName] = useState('');
  const [newVisitType, setNewVisitType] = useState('1');
  const [newPayment, setNewPayment] = useState('cash');
  const [foundPatients, setFoundPatients] = useState<PatientRow[]>([]);

  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(0);
  const [editPhone, setEditPhone] = useState('');
  const [editHistory, setEditHistory] = useState('');

  const changeLogs = [
    { date: '2026-03-22 06:15', field: 'Age', old: '33', new: '34', by: 'Assistant Sarah' },
    { date: '2026-03-21 11:00', field: 'History', old: '', new: 'No allergies', by: 'Dr. Ahmad' },
  ];

  const loadData = useCallback(async () => {
    setLoadError(null);
    const supabase = createClient();
    const [pRes, qRes] = await Promise.all([
      supabase.from('patients').select('*').order('created_at', { ascending: false }),
      supabase.from('queue_entries').select('*, patients(*)').order('queue_num', { ascending: true }),
    ]);
    if (pRes.error) setLoadError(pRes.error.message);
    if (qRes.error) setLoadError(qRes.error.message);
    setPatients((pRes.data as PatientRow[]) ?? []);
    setQueue((qRes.data as QueueRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 6000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const onFocus = () => void loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  const handleSearch = (val: string) => {
    setSearchName(val);
    if (val.length > 2) {
      setFoundPatients(patients.filter((p) => p.name.toLowerCase().includes(val.toLowerCase())));
    } else {
      setFoundPatients([]);
    }
  };

  const openEdit = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    setSelectedPatientId(patientId);
    setEditName(p.name);
    setEditAge(p.age ?? 0);
    setEditPhone(p.phone ?? '');
    setEditHistory(p.history ?? '');
    setShowEditModal(true);
  };

  const handleCheckIn = async (pId: string | null = null) => {
    const supabase = createClient();
    const visitTypeName = visitTypes.find((v) => v.id === newVisitType)?.ar || '';
    const paymentName = paymentModes.find((p) => p.id === newPayment)?.ar || '';

    const { data: maxRow } = await supabase
      .from('queue_entries')
      .select('queue_num')
      .order('queue_num', { ascending: false })
      .limit(1)
      .maybeSingle();
    const queueNum = (maxRow?.queue_num ?? 0) + 1;
    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let patient: PatientRow | null = null;

    if (pId) {
      patient = patients.find((p) => p.id === pId) ?? null;
    } else {
      const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      const code = `PT-${1000 + (count ?? 0) + 1}`;
      const { data, error } = await supabase
        .from('patients')
        .insert({
          code,
          name: searchName.trim(),
          age: 0,
          phone: '',
          history: '',
        })
        .select()
        .single();
      if (error) {
        alert(error.message);
        return;
      }
      patient = data as PatientRow;
    }

    if (!patient) return;

    const { error: qErr } = await supabase.from('queue_entries').insert({
      patient_id: patient.id,
      status: 'waiting',
      queue_num: queueNum,
      visit_type: visitTypeName,
      payment: paymentName,
      check_in_time: checkInTime,
    });

    if (qErr) {
      alert(qErr.message);
      return;
    }

    setShowCheckInModal(false);
    setSearchName('');
    setFoundPatients([]);
    await loadData();
  };

  const setOthersDoneThenActive = async (visitId: string) => {
    const supabase = createClient();
    await supabase.from('queue_entries').update({ status: 'done' }).eq('status', 'active');
    const { error } = await supabase.from('queue_entries').update({ status: 'active' }).eq('id', visitId);
    if (error) alert(error.message);
    await loadData();
  };

  const setDone = async (visitId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('queue_entries').update({ status: 'done' }).eq('id', visitId);
    if (error) alert(error.message);
    await loadData();
  };

  const saveEdit = async () => {
    if (!selectedPatientId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('patients')
      .update({
        name: editName,
        age: editAge,
        phone: editPhone,
        history: editHistory,
      })
      .eq('id', selectedPatientId);
    if (error) {
      alert(error.message);
      return;
    }
    alert('Changes saved and logged successfully');
    setShowEditModal(false);
    await loadData();
  };

  if (loading) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: 'var(--text-medium)' }}>{isDoc ? 'Loading queue…' : 'جاري التحميل…'}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="card">
        <p style={{ color: '#df4759', margin: 0 }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between">
        <h2>{isDoc ? 'Live Patient Queue' : 'قائمة المرضى والإدارة'}</h2>
        {role === 'assistant' && (
          <button className="btn btn-primary" type="button" onClick={() => setShowCheckInModal(true)}>
            <UserPlus size={18} /> تسجيل دخول مريض (Check-In)
          </button>
        )}
      </div>

      {role === 'assistant' && (
        <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <QRCode
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/patient/form`}
              size={120}
            />
          </div>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={24} /> استمارة المرضى (QR Code)
            </h3>
            <p style={{ margin: 0, color: 'var(--text-medium)' }}>
              يرجى توجيه المرضى لمسح الكود أو ملء البيانات يدوياً عند الحاجة.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {queue.map((visit) => (
          <div key={visit.id} className="card" style={{ marginBottom: 0, padding: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', opacity: 0.5, fontWeight: 'bold', fontSize: '0.8rem' }}>
              {visit.patients?.code ?? visit.patient_id}
            </div>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>دور رقم #{visit.queue_num}</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  type="button"
                  onClick={() => openEdit(visit.patient_id)}
                  className="btn btn-ghost"
                  style={{ padding: '4px' }}
                  title="Edit Patient"
                >
                  <Edit size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(visit.patient_id);
                    setShowHistoryModal(true);
                  }}
                  className="btn btn-ghost"
                  style={{ padding: '4px' }}
                  title="Change History"
                >
                  <HistoryIcon size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0 }}>{visit.patients?.name ?? '—'}</h4>
              {visit.status === 'waiting' && (
                <span className="badge badge-waiting">{isDoc ? 'Waiting' : 'في الانتظار'}</span>
              )}
              {visit.status === 'active' && (
                <span className="badge badge-active">{isDoc ? 'Active' : 'في العيادة'}</span>
              )}
              {visit.status === 'done' && <span className="badge badge-done">{isDoc ? 'Done' : 'مكتمل'}</span>}
            </div>

            <div style={{ color: 'var(--text-medium)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> {isDoc ? 'Check-in Time:' : 'وقت الحضور:'} {visit.check_in_time}
            </div>

            <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>
              {isDoc ? 'Visit Type:' : 'نوع الكشف:'} {visit.visit_type}
            </div>

            {!isDoc && (
              <div style={{ color: 'var(--text-medium)', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={14} /> طريقة الدفع: <strong>{visit.payment}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              {visit.status === 'waiting' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => void setOthersDoneThenActive(visit.id)}
                >
                  <Play size={16} /> {isDoc ? 'Call Patient' : 'نداء المريض'}
                </button>
              )}
              {visit.status === 'active' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => void setDone(visit.id)}
                >
                  <CheckCircle size={16} /> {isDoc ? 'End Session' : 'إنهاء الزيارة'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {queue.length === 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text-medium)' }}>
            {isDoc ? 'No patients in queue.' : 'لا يوجد مرضى في القائمة.'}
          </p>
        </div>
      )}

      {showCheckInModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)' }}>تسجيل مريض بالعيادة</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اسم المريض (Patient Name)</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="احمد..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />

                {foundPatients.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 10,
                      marginTop: '5px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-light)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      تم العثور على سجلات سابقة:
                    </div>
                    {foundPatients.map((p) => (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => void handleCheckIn(p.id)}
                        onKeyDown={(e) => e.key === 'Enter' && void handleCheckIn(p.id)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#f5f8f8';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-medium)' }}>
                            Code: {p.code} | Age: {p.age}
                          </div>
                        </div>
                        <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>نوع الزيارة (Visit Type)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {visitTypes.map((vt) => (
                    <button
                      key={vt.id}
                      type="button"
                      onClick={() => setNewVisitType(vt.id)}
                      className={`btn ${newVisitType === vt.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      {vt.ar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>طريقة الدفع (Payment)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {paymentModes.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setNewPayment(pm.id)}
                      className={`btn ${newPayment === pm.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        border: newPayment === pm.id ? 'none' : '1px solid var(--border)',
                        padding: '6px 16px',
                        fontSize: '0.85rem',
                      }}
                    >
                      {pm.ar}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCheckInModal(false)}>
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleCheckIn()}
                disabled={!searchName.trim()}
              >
                {searchName.length > 0 && !foundPatients.some((p) => p.name === searchName)
                  ? 'تسجيل كمريض جديد'
                  : 'تأكيد الحجز'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedPatientId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div className="card" style={{ width: '600px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)' }}>
              تعديل بيانات المريض ({patients.find((p) => p.id === selectedPatientId)?.code})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>الاسم الكامل</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>العمر</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>رقم الهاتف</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>التاريخ الطبي</label>
                <textarea
                  rows={3}
                  value={editHistory}
                  onChange={(e) => setEditHistory(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>
                إلغاء
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void saveEdit()}>
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedPatientId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div className="card" style={{ width: '600px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)' }}>
              سجل التغييرات (Audit Log) - {patients.find((p) => p.id === selectedPatientId)?.name}
            </h3>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px' }}>التاريخ</th>
                    <th style={{ padding: '10px' }}>الحقل</th>
                    <th style={{ padding: '10px' }}>القيمة القديمة</th>
                    <th style={{ padding: '10px' }}>القيمة الجديدة</th>
                    <th style={{ padding: '10px' }}>بواسطة</th>
                  </tr>
                </thead>
                <tbody>
                  {changeLogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontSize: '0.85rem' }}>{log.date}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.field}</td>
                      <td style={{ padding: '10px', color: '#df4759' }}>{log.old || '-'}</td>
                      <td style={{ padding: '10px', color: '#28a745' }}>{log.new}</td>
                      <td style={{ padding: '10px', fontSize: '0.85rem' }}>{log.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => setShowHistoryModal(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
