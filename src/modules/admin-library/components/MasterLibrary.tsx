"use client";

import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';

const medications = [
  { id: '1', trade_name_en: 'Cipralex', generic_name_en: 'Escitalopram', category: 'SSRI', dose_form: 'Pill' },
  { id: '2', trade_name_en: 'Lustral', generic_name_en: 'Sertraline', category: 'SSRI', dose_form: 'Pill' },
  { id: '3', trade_name_en: 'Prozac', generic_name_en: 'Fluoxetine', category: 'SSRI', dose_form: 'Pill' },
  { id: '4', trade_name_en: 'Seroquel', generic_name_en: 'Quetiapine', category: 'Atypical Antipsychotic', dose_form: 'Pill' },
];

const frequencies = [
  { id: '1', code_en: 'OD', label_ar: 'مرة يومياً' },
  { id: '2', code_en: 'BD', label_ar: 'مرتين يومياً' },
];

const titrations = [
  { id: '1', med_name: 'Cipralex', steps: [{ day_range: '1-7', dose_value: '5mg' }, { day_range: '8+', dose_value: '10mg' }] },
];

export default function MasterLibrary() {
  const [activeTab, setActiveTab] = useState<'medications' | 'frequencies' | 'titrations'>('medications');

  return (
    <div className="card">
      <div className="flex-between">
        <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>Clinical Brain (Master Library)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${activeTab === 'medications' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('medications')}>Medications</button>
          <button className={`btn ${activeTab === 'frequencies' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('frequencies')}>Frequencies</button>
          <button className={`btn ${activeTab === 'titrations' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('titrations')}>Titration Protocols</button>
        </div>
      </div>

      {activeTab === 'medications' && (
        <div>
          <div className="flex-between" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-medium)' }}>Medications List</h3>
            <button className="btn btn-primary"><Plus size={16} /> Add Medication</button>
          </div>
          <div className="table-container">
            <table style={{ textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Trade Name</th>
                  <th style={{ textAlign: 'left' }}>Generic Name</th>
                  <th style={{ textAlign: 'left' }}>Category</th>
                  <th style={{ textAlign: 'left' }}>Dose Form</th>
                  <th style={{ textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map(med => (
                  <tr key={med.id}>
                    <td>{med.trade_name_en}</td>
                    <td>{med.generic_name_en}</td>
                    <td>{med.category}</td>
                    <td>{med.dose_form}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost"><Edit2 size={16} /></button>
                        <button className="btn btn-ghost" style={{ color: '#df4759' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'frequencies' && (
        <div>
          <div className="flex-between" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-medium)' }}>Dosage Frequencies</h3>
            <button className="btn btn-primary"><Plus size={16} /> Add Frequency</button>
          </div>
          <div className="table-container">
            <table style={{ textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Code (EN)</th>
                  <th style={{ textAlign: 'left' }}>Label (AR)</th>
                  <th style={{ textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {frequencies.map(freq => (
                  <tr key={freq.id}>
                    <td>{freq.code_en}</td>
                    <td>{freq.label_ar}</td>
                    <td>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button className="btn btn-ghost"><Edit2 size={16} /></button>
                         <button className="btn btn-ghost" style={{ color: '#df4759' }}><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'titrations' && (
        <div>
          <div className="flex-between" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-medium)' }}>Titration Protocols</h3>
            <button className="btn btn-primary"><Plus size={16} /> Add Protocol</button>
          </div>
          <div className="table-container">
            <table style={{ textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Medication Name</th>
                  <th style={{ textAlign: 'left' }}>Titration Steps</th>
                  <th style={{ textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {titrations.map(titration => (
                  <tr key={titration.id}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{titration.med_name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {titration.steps.map((step, idx) => (
                          <div key={idx} style={{ background: 'var(--border)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                            Day {step.day_range}: {step.dose_value}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button className="btn btn-ghost"><Edit2 size={16} /></button>
                         <button className="btn btn-ghost" style={{ color: '#df4759' }}><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
