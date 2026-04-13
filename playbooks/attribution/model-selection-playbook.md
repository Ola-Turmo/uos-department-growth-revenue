# Attribution Model Selection Playbook

## Purpose
Guide the selection of appropriate attribution model based on business context

## Trigger Conditions
- New attribution analysis requested
- Model comparison needed
- Attribution confidence low

## Step-by-Step Procedure

### 1. Assess Journey Characteristics
- **Short journeys (1-2 touches)**: Consider first/last touch
- **Medium journeys (3-5 touches)**: Consider linear or time-decay
- **Long journeys (5+ touches)**: Consider u-shaped or position-based

### 2. Evaluate Business Context
- **Brand awareness focus**: First-touch may overvalue awareness channels
- **Conversion focus**: Last-touch may overvalue closing channels
- **Full-funnel visibility**: Multi-touch models preferred

### 3. Check Data Quality
- **Low touchpoint count**: Avoid multi-touch models
- **High confidence needs**: Consider data-driven if data sufficient
- **Time sensitivity**: Real-time needs may limit model options

### 4. Select Model
| Journey Length | Model | Best For |
|----------------|-------|----------|
| Single touch | first_touch | Awareness campaigns |
| Short (2-3) | last_touch | Conversion campaigns |
| Medium (3-5) | linear | Balanced view |
| Medium (3-5) | time_decay | Recent touch importance |
| Long (5+) | u_shaped | First & last emphasis |
| Variable | position_based | Tuned attribution |

### 5. Validate & Document
- Run attribution with selected model
- Review confidence scores
- Document model selection rationale

## Success Criteria
- Model selected based on data-driven criteria
- Confidence scores within acceptable range
- Selection rationale documented

## Escalation Points
- Confidence < 0.5 → Request data quality review
- Model disagreement > 20% → Use ensemble approach
