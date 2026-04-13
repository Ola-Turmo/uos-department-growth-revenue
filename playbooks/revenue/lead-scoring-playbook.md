# Lead Scoring Calibration Playbook

## Purpose
Guide lead scoring model calibration and ongoing tuning

## Trigger Conditions
- Lead scoring accuracy declining
- New data sources available
- Business context changes

## Prerequisites
- [ ] Historical conversion data available
- [ ] Lead scoring model deployed
- [ ] Feedback loop established

## Step-by-Step Procedure

### 1. Data Collection
1. Gather historical lead data with known outcomes
2. Include both converted and non-converted leads
3. Collect behavioral signals (website, email, demo)

### 2. Feature Analysis
1. Identify predictive signals
2. Analyze signal strength
3. Remove noise variables

### 3. Weight Calibration
1. Review current weights
2. Compare predicted vs. actual outcomes
3. Adjust weights based on:
   - Signal importance
   - Conversion correlation
   - Business priorities

### 4. Validation
1. Test on holdout dataset
2. Calculate accuracy metrics
3. Verify grade distribution

### 5. Deployment
1. Update model weights
2. Re-score existing leads
3. Monitor for drift

## Success Criteria
- Accuracy > 75% on validation set
- Grade distribution within expected ranges
- Conversion rate matches score tiers
