-- Clinic-OS: Comprehensive Frequency & Titration Seeds
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. FREQUENCY DICTIONARY - Complete Medical Frequencies
-- =====================================================

-- Clear existing and insert comprehensive list
DELETE FROM public.frequency_dictionary;

INSERT INTO public.frequency_dictionary (phrase_en, phrase_ar) VALUES
  -- Daily frequencies
  ('OD', 'مرة يومياً'),
  ('QD', 'مرة يومياً'),
  ('BID', 'مرتين يومياً'),
  ('TID', 'ثلاث مرات يومياً'),
  ('QID', 'أربع مرات يومياً'),
  ('5x daily', 'خمس مرات يومياً'),

  -- Hourly frequencies
  ('Q4H', 'كل 4 ساعات'),
  ('Q6H', 'كل 6 ساعات'),
  ('Q8H', 'كل 8 ساعات'),
  ('Q12H', 'كل 12 ساعة'),
  ('Q24H', 'كل 24 ساعة'),

  -- Time-specific
  ('QHS', 'قبل النوم'),
  ('HS', 'وقت النوم'),
  ('QAM', 'في الصباح'),
  ('QPM', 'في المساء'),
  ('AC', 'قبل الأكل'),
  ('PC', 'بعد الأكل'),
  ('With meals', 'مع الأكل'),

  -- Special
  ('QOD', 'يوم بعد يوم'),
  ('QWK', 'مرة أسبوعياً'),
  ('BIW', 'مرتين أسبوعياً'),
  ('TIW', 'ثلاث مرات أسبوعياً'),
  ('PRN', 'عند الحاجة'),
  ('STAT', 'فوراً'),
  ('SOS', 'عند الضرورة مرة واحدة'),

  -- Weekly/Monthly
  ('Weekly', 'أسبوعياً'),
  ('Monthly', 'شهرياً'),
  ('Every 2 weeks', 'كل أسبوعين'),
  ('Every 3 months', 'كل 3 أشهر'),

  -- Psychiatric specific
  ('Tapering dose', 'جرعة متناقصة'),
  ('Loading dose', 'جرعة تحميلية'),
  ('Maintenance', 'جرعة استمرارية');


-- =====================================================
-- 2. TITRATION PROTOCOLS - Complete Psychiatric Medications
-- =====================================================

-- Clear existing and insert comprehensive list
DELETE FROM public.titration_protocols;

INSERT INTO public.titration_protocols (medication_name, start_dose, target_dose, increment_step, days_per_step, notes) VALUES

  -- ==================
  -- ANTIDEPRESSANTS (SSRIs)
  -- ==================
  ('Cipralex (Escitalopram)', '5mg', '20mg', '5mg', 7, 'Start 5mg, increase weekly by 5mg. Max 20mg. Take morning or evening.'),
  ('Lexapro (Escitalopram)', '5mg', '20mg', '5mg', 7, 'Same as Cipralex. Watch for initial anxiety.'),
  ('Zoloft (Sertraline)', '25mg', '200mg', '25mg', 7, 'Start 25mg, max 200mg. Good for anxiety comorbidity.'),
  ('Lustral (Sertraline)', '25mg', '200mg', '25mg', 7, 'Take with food to reduce GI side effects.'),
  ('Prozac (Fluoxetine)', '10mg', '80mg', '10mg', 7, 'Long half-life. Start 10mg, max 80mg. Good for OCD.'),
  ('Paxil (Paroxetine)', '10mg', '60mg', '10mg', 7, 'Sedating. Take at night. Watch for discontinuation syndrome.'),
  ('Seroxat (Paroxetine)', '10mg', '60mg', '10mg', 7, 'Avoid abrupt stop. Taper slowly when discontinuing.'),
  ('Celexa (Citalopram)', '10mg', '40mg', '10mg', 7, 'Max 40mg due to QT prolongation risk.'),
  ('Cipramil (Citalopram)', '10mg', '40mg', '10mg', 7, 'ECG monitoring at higher doses.'),
  ('Luvox (Fluvoxamine)', '50mg', '300mg', '50mg', 7, 'Good for OCD. Split doses if >100mg.'),

  -- ==================
  -- ANTIDEPRESSANTS (SNRIs)
  -- ==================
  ('Effexor (Venlafaxine)', '37.5mg', '225mg', '37.5mg', 7, 'XR formulation preferred. Monitor BP at high doses.'),
  ('Efexor (Venlafaxine)', '37.5mg', '225mg', '37.5mg', 7, 'Take with food. Do not crush XR.'),
  ('Cymbalta (Duloxetine)', '30mg', '120mg', '30mg', 7, 'Good for neuropathic pain. Monitor liver function.'),
  ('Pristiq (Desvenlafaxine)', '50mg', '100mg', '50mg', 14, 'Active metabolite of venlafaxine. Fewer drug interactions.'),

  -- ==================
  -- ANTIDEPRESSANTS (Tricyclics)
  -- ==================
  ('Tofranil (Imipramine)', '25mg', '200mg', '25mg', 7, 'Sedating. Take at night. ECG monitoring required.'),
  ('Amitriptyline (Elavil)', '10mg', '150mg', '10mg', 7, 'Good for migraine prophylaxis and chronic pain.'),
  ('Anafranil (Clomipramine)', '25mg', '250mg', '25mg', 7, 'Gold standard for OCD. High anticholinergic.'),

  -- ==================
  -- ANTIDEPRESSANTS (Others)
  -- ==================
  ('Remeron (Mirtazapine)', '7.5mg', '45mg', '7.5mg', 7, 'Take at night. Appetite increase common. Paradoxical dosing.'),
  ('Wellbutrin (Bupropion)', '75mg', '450mg', '75mg', 7, 'Do not use if seizure history. Good for smoking cessation.'),
  ('Bupropion SR', '100mg', '400mg', '100mg', 7, 'Twice daily dosing. Avoid bedtime dose.'),
  ('Bupropion XL', '150mg', '450mg', '150mg', 7, 'Once daily morning dose.'),
  ('Trazodone', '25mg', '400mg', '25mg', 7, 'Mainly for sleep. Take at night.'),
  ('Trittico (Trazodone)', '25mg', '400mg', '25mg', 7, 'Low dose for insomnia, high dose for depression.'),

  -- ==================
  -- ANTIPSYCHOTICS (Atypical)
  -- ==================
  ('Seroquel (Quetiapine)', '25mg', '800mg', '25-50mg', 3, 'Increase every 2-3 days. Very sedating initially.'),
  ('Seroquel XR', '50mg', '800mg', '50mg', 7, 'Extended release. Take without food for better absorption.'),
  ('Risperdal (Risperidone)', '0.5mg', '8mg', '0.5mg', 7, 'Watch for EPS at higher doses. Once or twice daily.'),
  ('Risperdal Consta', '25mg IM', '50mg IM', '12.5mg', 14, 'IM depot injection every 2 weeks.'),
  ('Zyprexa (Olanzapine)', '2.5mg', '20mg', '2.5mg', 7, 'Weight gain common. Metabolic monitoring required.'),
  ('Abilify (Aripiprazole)', '2mg', '30mg', '2mg', 7, 'Partial agonist. Less sedating. Akathisia possible.'),
  ('Geodon (Ziprasidone)', '20mg', '160mg', '20mg', 7, 'Take with food. ECG monitoring for QT interval.'),
  ('Invega (Paliperidone)', '3mg', '12mg', '3mg', 7, 'Active metabolite of risperidone.'),
  ('Clozaril (Clozapine)', '12.5mg', '900mg', '25mg', 7, 'Weekly CBC required. Reserve for treatment-resistant.'),
  ('Latuda (Lurasidone)', '20mg', '120mg', '20mg', 7, 'Take with 350 calories. Good for bipolar depression.'),
  ('Saphris (Asenapine)', '5mg', '10mg BID', '5mg', 7, 'Sublingual only. Do not swallow or eat/drink 10 min after.'),
  ('Rexulti (Brexpiprazole)', '0.5mg', '4mg', '0.5mg', 7, 'Adjunct for depression. Less akathisia than aripiprazole.'),

  -- ==================
  -- ANTIPSYCHOTICS (Typical)
  -- ==================
  ('Haldol (Haloperidol)', '0.5mg', '20mg', '0.5mg', 7, 'High EPS risk. Good for acute agitation.'),
  ('Haldol Decanoate', '50mg IM', '300mg IM', '50mg', 28, 'Monthly depot. Loading dose may be needed.'),

  -- ==================
  -- MOOD STABILIZERS
  -- ==================
  ('Depakene (Valproic Acid)', '125mg', '1500mg', '125mg', 7, 'Check levels. Target 50-100 mcg/mL. LFTs needed.'),
  ('Depakote (Divalproex)', '250mg', '2000mg', '250mg', 7, 'Take with food. Blood levels at steady state.'),
  ('Epilim (Sodium Valproate)', '200mg', '1500mg', '200mg', 7, 'Weight gain, tremor common. CBC and LFTs.'),
  ('Lamictal (Lamotrigine)', '25mg', '200mg', '25mg', 14, 'SLOW titration - increase every 2 weeks. Rash risk if too fast!'),
  ('Lamictal XR', '25mg', '300mg', '25mg', 14, 'Once daily. Do not double dose if missed.'),
  ('Lithium Carbonate', '150mg', '1200mg', '150mg', 7, 'Check levels (0.6-1.2 mEq/L). Thyroid and renal monitoring.'),
  ('Lithium SR', '300mg', '900mg', '300mg', 7, 'Sustained release. Levels 12h post dose.'),
  ('Tegretol (Carbamazepine)', '100mg', '1200mg', '100mg', 7, 'Auto-induction. Check levels, CBC, LFTs, Na.'),
  ('Carbatrol (Carbamazepine ER)', '100mg', '800mg', '100mg', 7, 'Extended release. BID dosing.'),
  ('Trileptal (Oxcarbazepine)', '150mg', '1200mg', '150mg', 7, 'Less auto-induction than carbamazepine. Watch Na.'),
  ('Equetro (Carbamazepine ER)', '100mg', '800mg', '100mg', 7, 'FDA approved for bipolar.'),
  ('Topamax (Topiramate)', '25mg', '200mg', '25mg', 7, 'Appetite suppressant. Cognitive slowing. Good for binge eating.'),
  ('Neurontin (Gabapentin)', '100mg', '1800mg', '100mg', 7, 'Adjunct for anxiety. Not a primary mood stabilizer.'),
  ('Gabapentin', '100mg', '1800mg', '100mg', 7, 'TID dosing. Renal dosing if CrCl <60.'),
  ('Lyrica (Pregabalin)', '50mg', '600mg', '50mg', 7, 'BID dosing. Schedule V controlled.'),

  -- ==================
  -- ANXIOLYTICS (Benzodiazepines)
  -- ==================
  ('Xanax (Alprazolam)', '0.25mg', '0.5mg TID', '0.125mg', 5, 'SHORT TERM ONLY. High addiction potential. Taper to stop.'),
  ('Xanax XR', '0.5mg', '3mg', '0.5mg', 7, 'Once daily. Still requires slow taper to discontinue.'),
  ('Ativan (Lorazepam)', '0.5mg', '2mg TID', '0.5mg', 7, 'No active metabolites - safer in liver disease.'),
  ('Lorazepam', '0.5mg', '2mg TID', '0.5mg', 7, 'Good for acute agitation. IM available.'),
  ('Klonopin (Clonazepam)', '0.25mg', '2mg BID', '0.25mg', 7, 'Long half-life. Good for panic disorder.'),
  ('Rivotril (Clonazepam)', '0.25mg', '2mg BID', '0.25mg', 7, 'Also used for seizures. Taper slowly.'),
  ('Valium (Diazepam)', '2mg', '10mg TID', '2mg', 7, 'Very long half-life. Multiple active metabolites.'),
  ('Diazepam', '2mg', '10mg TID', '2mg', 7, 'Avoid in elderly. Good for alcohol withdrawal.'),
  ('Restoril (Temazepam)', '7.5mg', '30mg', '7.5mg', 7, 'For sleep only. 7-8 hours sleep time needed.'),
  ('Bromazepam (Lexotanil)', '1.5mg', '6mg', '1.5mg', 7, 'Intermediate half-life. Available in Middle East.'),

  -- ==================
  -- ANXIOLYTICS (Non-BZD)
  -- ==================
  ('Buspar (Buspirone)', '5mg BID', '30mg BID', '5mg', 7, 'Takes 2-4 weeks to work. No sedation or dependence.'),
  ('Buspirone', '5mg BID', '30mg BID', '5mg', 7, 'Take consistently with/without food.'),
  ('Vistaril (Hydroxyzine)', '10mg', '50mg QID', '10mg', 7, 'Antihistamine. PRN use OK. Not habit forming.'),
  ('Atarax (Hydroxyzine)', '10mg', '50mg QID', '10mg', 7, 'Good for PRN anxiety. Sedating.'),
  ('Inderal (Propranolol)', '10mg', '80mg', '10mg', 7, 'For performance anxiety. Take 1h before event.'),
  ('Propranolol', '10mg', '80mg', '10mg', 7, 'Also helps with akathisia from antipsychotics.'),

  -- ==================
  -- SLEEP MEDICATIONS
  -- ==================
  ('Ambien (Zolpidem)', '5mg', '10mg', '5mg', 7, 'SHORT TERM. Take in bed, not before. 7-8h sleep needed.'),
  ('Stilnox (Zolpidem)', '5mg', '10mg', '5mg', 7, 'Avoid with alcohol. Do not drive next morning.'),
  ('Sonata (Zaleplon)', '5mg', '20mg', '5mg', 7, 'Very short acting. Good for sleep onset.'),
  ('Lunesta (Eszopiclone)', '1mg', '3mg', '1mg', 7, 'Can be used longer term than zolpidem.'),
  ('Rozerem (Ramelteon)', '8mg', '16mg', '8mg', 7, 'Melatonin agonist. No dependence. Take 30min before bed.'),
  ('Belsomra (Suvorexant)', '5mg', '20mg', '5mg', 7, 'Orexin antagonist. Newer mechanism.'),
  ('Silenor (Doxepin)', '3mg', '6mg', '3mg', 7, 'Low dose tricyclic for sleep maintenance.'),
  ('Estazolam', '0.5mg', '2mg', '0.5mg', 7, 'Intermediate acting BZD for sleep.'),
  ('Nitrazepam', '2.5mg', '10mg', '2.5mg', 7, 'Longer acting sleep BZD. Morning grogginess.'),
  ('Flurazepam', '15mg', '30mg', '15mg', 7, 'Very long half-life. Avoid in elderly.'),
  ('Melatonin', '1mg', '10mg', '1mg', 7, 'OTC. Take 1-2h before desired sleep time.'),

  -- ==================
  -- ADHD MEDICATIONS
  -- ==================
  ('Ritalin (Methylphenidate)', '5mg', '60mg', '5mg', 7, 'IR: 2-3x daily. Check BP, weight. Avoid after 6pm.'),
  ('Ritalin LA', '10mg', '60mg', '10mg', 7, 'Once daily morning. 50% IR, 50% delayed release.'),
  ('Concerta (Methylphenidate ER)', '18mg', '72mg', '18mg', 7, 'ODT system. 22% IR, 78% delayed.'),
  ('Adderall (Mixed Amphetamines)', '5mg', '40mg', '5mg', 7, 'IR: 1-2x daily. Controlled substance. Appetite suppress.'),
  ('Adderall XR', '10mg', '30mg', '10mg', 7, 'Once daily morning. 50% IR, 50% delayed.'),
  ('Vyvanse (Lisdexamfetamine)', '20mg', '70mg', '10mg', 7, 'Prodrug. Once daily. Longer duration.'),
  ('Strattera (Atomoxetine)', '18mg', '100mg', '18mg', 7, 'Non-stimulant. Takes 2-4 weeks. Once or twice daily.'),
  ('Intuniv (Guanfacine ER)', '1mg', '4mg', '1mg', 7, 'Non-stimulant. Alpha-2 agonist. Good with stimulants.'),
  ('Kapvay (Clonidine ER)', '0.1mg', '0.4mg', '0.1mg', 7, 'Non-stimulant. Sedating. Good for comorbid tic disorders.'),
  ('Wellbutrin for ADHD', '75mg', '300mg', '75mg', 7, 'Off-label. Good for comorbid depression.'),

  -- ==================
  -- DEMENTIA MEDICATIONS
  -- ==================
  ('Aricept (Donepezil)', '5mg', '23mg', '5mg', 28, 'Start 5mg, increase to 10mg after 4-6 weeks. Take at night.'),
  ('Razadyne (Galantamine)', '4mg', '24mg', '4mg', 28, 'Take with food. IR: BID, ER: once daily.'),
  ('Exelon (Rivastigmine)', '1.5mg', '6mg BID', '1.5mg', 28, 'Patch available. Less GI side effects with patch.'),
  ('Namenda (Memantine)', '5mg', '20mg', '5mg', 7, 'Start 5mg, increase weekly by 5mg. Target 10mg BID.'),
  ('Namenda XR', '7mg', '28mg', '7mg', 7, 'Once daily. Can combine with cholinesterase inhibitor.'),
  ('Namzaric (Donepezil/Memantine)', '7/10mg', '28/10mg', '7mg memantine', 7, 'Combination. Once daily.'),

  -- ==================
  -- ANTIPARKINSON (for drug-induced EPS)
  -- ==================
  ('Cogentin (Benztropine)', '0.5mg', '2mg BID', '0.5mg', 7, 'For antipsychotic-induced EPS. Anticholinergic.'),
  ('Artane (Trihexyphenidyl)', '1mg', '5mg TID', '1mg', 7, 'Alternative to benztropine.'),
  ('Akineton (Biperiden)', '1mg', '2mg TID', '1mg', 7, 'Similar to benztropine.'),
  ('Amantadine', '100mg', '200mg BID', '100mg', 7, 'For mild EPS. Also antiviral.'),

  -- ==================
  -- OTHER PSYCHOTROPICS
  -- ==================
  ('Catapres (Clonidine)', '0.1mg', '0.3mg', '0.1mg', 7, 'For anxiety, ADHD, opioid withdrawal. Taper to stop.'),
  ('Tenex (Guanfacine)', '1mg', '3mg', '1mg', 7, 'Less sedating than clonidine.'),
  ('Antabuse (Disulfiram)', '250mg', '500mg', '250mg', 7, 'For alcohol dependence. Must be abstinent 12h before start.'),
  ('Campral (Acamprosate)', '333mg TID', '666mg TID', '333mg', 7, 'For alcohol dependence. Start after detox.'),
  ('Revia (Naltrexone)', '25mg', '50mg', '25mg', 7, 'For alcohol/opioid dependence. Must be opioid-free.'),
  ('Vivitrol (Naltrexone IM)', '380mg IM', '380mg IM', 'N/A', 28, 'Monthly injection. Must be opioid-free 7-10 days.'),
  ('Chantix (Varenicline)', '0.5mg', '1mg BID', '0.5mg', 7, 'For smoking cessation. Week 1: 0.5mg QD, then BID.'),
  ('Zyban (Bupropion SR)', '150mg', '150mg BID', '150mg', 7, 'For smoking cessation. Start 1 week before quit date.');


-- =====================================================
-- 3. Enable RLS for titration_protocols
-- =====================================================

ALTER TABLE public.titration_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "titration_protocols_staff_approved"
  ON public.titration_protocols FOR ALL
  USING (public.is_staff_approved())
  WITH CHECK (public.is_staff_approved());


-- =====================================================
-- 4. Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_frequency_phrase_en ON public.frequency_dictionary(phrase_en);
CREATE INDEX IF NOT EXISTS idx_titration_medication ON public.titration_protocols(medication_name);


-- Verify counts
SELECT 'Frequencies seeded: ' || COUNT(*)::text FROM public.frequency_dictionary
UNION ALL
SELECT 'Titrations seeded: ' || COUNT(*)::text FROM public.titration_protocols;
