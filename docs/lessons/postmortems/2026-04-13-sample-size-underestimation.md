# Postmortem: Sample Size Underestimation

**Date**: 2026-04-13  
**Severity**: Medium  
**Resolution**: Fixed  

## What Happened

An experiment was concluded after 3 days with insufficient sample size. The result showed a positive lift of 15% with p=0.04, but a follow-up analysis revealed the actual lift was closer to 5% when proper sample size was reached.

## Root Cause

1. Sample size calculator was not integrated into experiment tracking
2. No automated alert when experiment ended before reaching required sample
3. Pressure to ship quickly overrode statistical rigor

## Lessons Learned

1. **Always calculate required sample size before starting experiment**
2. **Build in sample size monitoring into experiment tracking**
3. **Set clear stop rules before experiment begins**

## Action Items

- [x] Integrate sample size calculator into experiment designer
- [ ] Add automated alerts for experiments ending early
- [ ] Create experiment governance checklist

## Prevention

Implement experiment pre-approval process that requires:
- Sample size calculation
- Expected duration
- Stop/go criteria
