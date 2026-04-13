# Incident Response: Low Attribution Confidence

## Severity
Medium-High

## Symptoms
- Attribution confidence < 0.5
- Single channel receiving >80% credit
- Model shows high variance

## Immediate Response

### 1. Verify Data Quality
- Check touchpoint data completeness
- Verify conversion tracking
- Validate lookback window

### 2. Identify Root Cause
- Insufficient touchpoints?
- Short conversion window?
- Data collection gaps?

### 3. Apply Mitigation
- Use longer lookback window if data available
- Consider single-touch model for sparse data
- Add confidence disclaimer to reports

## Resolution Steps
1. Document data quality issues
2. Implement data collection improvements
3. Re-run attribution with improved data
4. Update confidence thresholds

## Prevention
- Monitor attribution confidence weekly
- Set alerts for confidence < 0.6
- Regular data quality audits
