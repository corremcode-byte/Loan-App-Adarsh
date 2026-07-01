import { ApplicationFormData } from '@/types';

// ─── Slab ladders ────────────────────────────────────────────────────────────

const SECURED_SLABS = [
  100000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000,
  2500000, 3500000, 5000000, 7500000, 10000000, 15000000, 20000000,
  25000000, 30000000, 40000000, 50000000,
];

const UNSECURED_SLABS = [
  50000, 75000, 100000, 150000, 200000, 250000, 300000, 500000, 750000,
  1000000, 1500000, 2000000, 2500000, 3000000, 4000000,
];

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SlabRecommendationResult {
  recommendedSlab: number;
  requestedAmount: number;
  percentageOfRequested: number;
  loanType: 'secured' | 'unsecured';
  foirDerivedMax: number;
  ltiDerivedMax: number;
  turnoverDerivedMax: number | null;
  collateralDerivedMax: number | null;
  rawComputedMax: number;
  cibilCeiling: number;
  scoreMultiplierApplied: number;
  finalAdjustedMax: number;
  reasoning: {
    foirReason: string;
    ltiReason: string;
    turnoverReason: string | null;
    collateralReason: string | null;
    scoreReason: string;
    cibilReason: string;
    bindingConstraint: 'FOIR' | 'LTI' | 'Turnover' | 'Collateral' | 'CIBIL' | 'Score';
  };
  improvementTips: string[];
  frontendMessage: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Indian locale formatter:
 *   ≥ 1,00,00,000 → "₹X.XX Cr"
 *   ≥ 1,00,000    → "₹X.X L"
 *   else           → "₹X" (en-IN)
 */
export function formatSlabAmount(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getCibilCeiling(cibilScore: number): { ceiling: number; reason: string } {
  if (cibilScore >= 800) return { ceiling: 50000000, reason: `CIBIL ${cibilScore} (≥800): ceiling ₹5 Cr.` };
  if (cibilScore >= 780) return { ceiling: 30000000, reason: `CIBIL ${cibilScore} (≥780): ceiling ₹3 Cr.` };
  if (cibilScore >= 760) return { ceiling: 20000000, reason: `CIBIL ${cibilScore} (≥760): ceiling ₹2 Cr.` };
  if (cibilScore >= 750) return { ceiling: 10000000, reason: `CIBIL ${cibilScore} (≥750): ceiling ₹1 Cr.` };
  if (cibilScore >= 740) return { ceiling: 7500000,  reason: `CIBIL ${cibilScore} (≥740): ceiling ₹75 L.` };
  if (cibilScore >= 730) return { ceiling: 5000000,  reason: `CIBIL ${cibilScore} (≥730): ceiling ₹50 L.` };
  if (cibilScore >= 720) return { ceiling: 2500000,  reason: `CIBIL ${cibilScore} (≥720): ceiling ₹25 L.` };
  if (cibilScore >= 710) return { ceiling: 1000000,  reason: `CIBIL ${cibilScore} (≥710): ceiling ₹10 L.` };
  if (cibilScore >= 700) return { ceiling: 500000,   reason: `CIBIL ${cibilScore} (≥700): ceiling ₹5 L.` };
  return { ceiling: 0, reason: `CIBIL ${cibilScore} (<700): below minimum threshold. No offer possible.` };
}

function getScoreMultiplier(score: number): { multiplier: number; reason: string } {
  if (score >= 85) return { multiplier: 1.00, reason: `Score ${score} (≥85): full amount offered (1.00×).` };
  if (score >= 70) return { multiplier: 0.80, reason: `Score ${score} (≥70): 80% of computed max offered.` };
  if (score >= 55) return { multiplier: 0.65, reason: `Score ${score} (≥55): 65% of computed max offered.` };
  if (score >= 40) return { multiplier: 0.50, reason: `Score ${score} (≥40): 50% of computed max offered.` };
  if (score >= 25) return { multiplier: 0.35, reason: `Score ${score} (≥25): 35% of computed max offered.` };
  return { multiplier: 0.00, reason: `Score ${score} (<25): profile too weak. No offer possible.` };
}

function buildImprovementTips(
  bindingConstraint: SlabRecommendationResult['reasoning']['bindingConstraint'],
  loanType: 'secured' | 'unsecured',
): string[] {
  const tips: string[] = [];
  switch (bindingConstraint) {
    case 'FOIR':
      tips.push('Reducing existing EMIs or increasing income will directly increase your eligible amount.');
      break;
    case 'LTI':
      tips.push('Your loan request exceeds the income multiple limit. A higher verified income would increase this ceiling.');
      break;
    case 'Turnover':
      tips.push('Eligible amount is capped at a percentage of annual turnover. Higher GST-verified turnover unlocks more.');
      break;
    case 'Collateral':
      tips.push('Providing a higher-value asset as collateral would increase the loan ceiling.');
      break;
    case 'CIBIL':
      tips.push('Improving your CIBIL score unlocks access to higher slabs. Find the next tier in the CIBIL ceiling table and aim for that score.');
      break;
    case 'Score':
      tips.push('A higher eligibility score (through better repayment history and lower credit utilization) increases the percentage of the maximum amount offered.');
      break;
  }
  if (loanType !== 'secured') {
    tips.push('Secured loans allow up to 6× annual income vs 3× for unsecured. Adding collateral could significantly increase your eligible amount.');
  }
  return tips;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Recommends the highest loan slab the applicant qualifies for.
 *
 * Call this AFTER `calculateEligibility()` from eligibility.ts — pass the
 * `score` from its return value as `eligibilityScore`. The function is
 * intentionally standalone: it re-derives all financial ceilings from first
 * principles so it can be used independently without importing from
 * eligibility.ts.
 *
 * @param data            - Full `ApplicationFormData` from the application form.
 * @param eligibilityScore - The 0–100 score returned by `calculateEligibility()`.
 * @returns               - A `SlabRecommendationResult` with the recommended
 *                          slab, all intermediate ceilings, the binding
 *                          constraint, improvement tips, and a ready-to-display
 *                          `frontendMessage`.
 */
export function recommendLoanSlab(
  data: ApplicationFormData,
  eligibilityScore: number,
): SlabRecommendationResult {
  const loanType: 'secured' | 'unsecured' =
    data.loanType === 'secured' ? 'secured' : 'unsecured';

  const slabs      = loanType === 'secured' ? SECURED_SLABS : UNSECURED_SLABS;
  const productMax = loanType === 'secured' ? 50000000 : 4000000;
  const productMin = loanType === 'secured' ? 100000   : 50000;

  // ── STEP 1: Four raw ceilings ────────────────────────────────────────────

  // 1a. FOIR
  const foirLimitMap: Record<string, number> = {
    salaried:      0.50,
    'self-employed': 0.45,
    business:      0.45,
    retired:       0.40,
  };
  const foirLimit       = foirLimitMap[data.occupation] ?? 0.50;
  const existingEMISum  = data.existingLoans.reduce((s, l) => s + l.emi, 0);
  const headroomEMI     = data.monthlyIncome * foirLimit - existingEMISum;

  let foirDerivedMax: number;
  let foirReason: string;
  if (headroomEMI <= 0) {
    foirDerivedMax = 0;
    foirReason = `No EMI headroom: existing EMIs (₹${existingEMISum.toLocaleString('en-IN')}) already consume ≥${foirLimit * 100}% of income.`;
  } else {
    // Principal from EMI using reducing-balance formula, r = 14% p.a.
    const r = 0.14 / 12;
    const n = data.preferredTenure;
    foirDerivedMax = headroomEMI * ((1 - Math.pow(1 + r, -n)) / r);
    foirReason = `${foirLimit * 100}% FOIR limit gives EMI headroom ₹${Math.round(headroomEMI).toLocaleString('en-IN')}/mo → principal ${formatSlabAmount(Math.round(foirDerivedMax))}.`;
  }

  // 1b. LTI
  const annualIncome   = data.monthlyIncome * 12;
  const ltiMultiplier  = loanType === 'secured' ? 6 : 3;
  const ltiDerivedMax  = annualIncome * ltiMultiplier;
  const ltiReason      = `${ltiMultiplier}× annual income (${loanType}): ${formatSlabAmount(ltiDerivedMax)}.`;

  // 1c. Turnover (business / self-employed only)
  //     monthlyIncome stores monthly turnover for business applicants.
  let turnoverDerivedMax: number | null = null;
  let turnoverReason: string | null = null;
  const isBusinessOrSE =
    data.occupation === 'business' || data.occupation === 'self-employed';
  if (isBusinessOrSE) {
    const annualTurnover = data.monthlyIncome * 12;
    if (annualTurnover > 0) {
      const pct            = loanType === 'secured' ? 0.25 : 0.15;
      turnoverDerivedMax   = annualTurnover * pct;
      turnoverReason       = `${pct * 100}% of annual turnover ${formatSlabAmount(annualTurnover)} = ${formatSlabAmount(turnoverDerivedMax)}.`;
    } else {
      turnoverReason = 'Annual turnover unavailable; turnover ceiling skipped.';
    }
  }

  // 1d. Collateral (secured only)
  let collateralDerivedMax: number | null = null;
  let collateralReason: string | null = null;
  if (loanType === 'secured') {
    const cv = data.collateral?.estimatedValue ?? 0;
    if (cv > 0) {
      collateralDerivedMax = cv * 0.70;
      collateralReason     = `70% of collateral value ${formatSlabAmount(cv)} = ${formatSlabAmount(collateralDerivedMax)}.`;
    } else {
      collateralReason = 'No collateral value provided; collateral ceiling skipped.';
    }
  }

  // rawMax = min of applicable ceilings; track binding constraint
  type RawConstraint = 'FOIR' | 'LTI' | 'Turnover' | 'Collateral';
  const applicable: { value: number; label: RawConstraint }[] = [
    { value: foirDerivedMax, label: 'FOIR' },
    { value: ltiDerivedMax,  label: 'LTI'  },
  ];
  if (turnoverDerivedMax !== null) {
    applicable.push({ value: turnoverDerivedMax, label: 'Turnover' });
  }
  if (collateralDerivedMax !== null) {
    applicable.push({ value: collateralDerivedMax, label: 'Collateral' });
  }

  let rawComputedMax = applicable[0].value;
  let bindingConstraint: SlabRecommendationResult['reasoning']['bindingConstraint'] =
    applicable[0].label;

  for (const c of applicable) {
    if (c.value < rawComputedMax) {
      rawComputedMax    = c.value;
      bindingConstraint = c.label;
    }
  }

  // ── STEP 2: CIBIL hard ceiling ───────────────────────────────────────────

  const { ceiling: cibilCeiling, reason: cibilReason } = getCibilCeiling(data.cibilScore ?? 0);

  if (cibilCeiling < rawComputedMax) {
    bindingConstraint = 'CIBIL';
  }

  // ── STEP 3: Score multiplier ─────────────────────────────────────────────

  const { multiplier: scoreMultiplierApplied, reason: scoreReason } =
    getScoreMultiplier(eligibilityScore);

  // Immediate reject conditions
  if (scoreMultiplierApplied === 0 || cibilCeiling === 0) {
    const bc: SlabRecommendationResult['reasoning']['bindingConstraint'] =
      scoreMultiplierApplied === 0 ? 'Score' : 'CIBIL';
    const tips = buildImprovementTips(bc, loanType);
    return {
      recommendedSlab: 0,
      requestedAmount: data.loanAmount,
      percentageOfRequested: 0,
      loanType,
      foirDerivedMax:      Math.round(foirDerivedMax),
      ltiDerivedMax:       Math.round(ltiDerivedMax),
      turnoverDerivedMax:  turnoverDerivedMax  !== null ? Math.round(turnoverDerivedMax)  : null,
      collateralDerivedMax: collateralDerivedMax !== null ? Math.round(collateralDerivedMax) : null,
      rawComputedMax:      Math.round(rawComputedMax),
      cibilCeiling,
      scoreMultiplierApplied,
      finalAdjustedMax: 0,
      reasoning: {
        foirReason, ltiReason, turnoverReason, collateralReason,
        scoreReason, cibilReason,
        bindingConstraint: bc,
      },
      improvementTips: tips,
      frontendMessage: `We're unable to offer a loan based on your current profile. ${tips[0] ?? ''}`,
    };
  }

  const finalAdjustedMax      = rawComputedMax * scoreMultiplierApplied;
  const preMultiplierEffective = Math.min(rawComputedMax, cibilCeiling);
  if (finalAdjustedMax < preMultiplierEffective) {
    bindingConstraint = 'Score';
  }

  // ── STEP 4: Snap to slab ────────────────────────────────────────────────

  const effectiveMax = Math.min(finalAdjustedMax, cibilCeiling, productMax);

  if (effectiveMax < productMin) {
    const tips = buildImprovementTips(bindingConstraint, loanType);
    return {
      recommendedSlab: 0,
      requestedAmount: data.loanAmount,
      percentageOfRequested: 0,
      loanType,
      foirDerivedMax:      Math.round(foirDerivedMax),
      ltiDerivedMax:       Math.round(ltiDerivedMax),
      turnoverDerivedMax:  turnoverDerivedMax  !== null ? Math.round(turnoverDerivedMax)  : null,
      collateralDerivedMax: collateralDerivedMax !== null ? Math.round(collateralDerivedMax) : null,
      rawComputedMax:      Math.round(rawComputedMax),
      cibilCeiling,
      scoreMultiplierApplied,
      finalAdjustedMax: Math.round(finalAdjustedMax),
      reasoning: {
        foirReason, ltiReason, turnoverReason, collateralReason,
        scoreReason, cibilReason, bindingConstraint,
      },
      improvementTips: tips,
      frontendMessage: `We're unable to offer a loan based on your current profile. ${tips[0] ?? ''}`,
    };
  }

  // Highest slab ≤ effectiveMax (slabs are sorted ascending)
  let recommendedSlab = productMin;
  for (const slab of slabs) {
    if (slab <= effectiveMax) recommendedSlab = slab;
  }

  const tips                = buildImprovementTips(bindingConstraint, loanType);
  const requestedAmount     = data.loanAmount;
  const percentageOfRequested =
    requestedAmount > 0 ? Math.round((recommendedSlab / requestedAmount) * 100) : 0;

  let frontendMessage: string;
  if (recommendedSlab >= requestedAmount) {
    frontendMessage = `Congratulations! You qualify for your full requested amount of ${formatSlabAmount(requestedAmount)}.`;
  } else {
    frontendMessage = `Based on your financial profile, we can offer you ${formatSlabAmount(recommendedSlab)} (${percentageOfRequested}% of your requested ${formatSlabAmount(requestedAmount)}). ${tips[0] ?? ''}`;
  }

  return {
    recommendedSlab,
    requestedAmount,
    percentageOfRequested,
    loanType,
    foirDerivedMax:      Math.round(foirDerivedMax),
    ltiDerivedMax:       Math.round(ltiDerivedMax),
    turnoverDerivedMax:  turnoverDerivedMax  !== null ? Math.round(turnoverDerivedMax)  : null,
    collateralDerivedMax: collateralDerivedMax !== null ? Math.round(collateralDerivedMax) : null,
    rawComputedMax:      Math.round(rawComputedMax),
    cibilCeiling,
    scoreMultiplierApplied,
    finalAdjustedMax:    Math.round(finalAdjustedMax),
    reasoning: {
      foirReason, ltiReason, turnoverReason, collateralReason,
      scoreReason, cibilReason, bindingConstraint,
    },
    improvementTips: tips,
    frontendMessage,
  };
}
