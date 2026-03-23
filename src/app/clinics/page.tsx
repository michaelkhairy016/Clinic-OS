"use client";

import React from 'react';
import ClinicsManager from '@/modules/admin-clinics/ClinicsManager';

export default function ClinicsPage() {
  return (
    <div>
      <div className="flex-between">
        <h2>Settings: Clinics & Locations</h2>
      </div>
      <ClinicsManager />
    </div>
  );
}
