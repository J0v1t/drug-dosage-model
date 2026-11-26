# Analytical verification and published-reference evaluation

Implemented for the paper's stated objective: verify the Python implementation against analytical solutions and evaluate against published pharmacokinetic references where applicable. These notes are research documentation, not an application reporting feature.

## Numerical implementation

The model has an oral depot G and one systemic amount A:

```
dG/dt = -ka G
dA/dt = F ka G - ke A
C = A/V
dAUC/dt = C
ke = ln(2)/half-life
```

Units are mg, L and hours; concentration is mg/L. Bioavailability is stored as a percentage in the interface and converted to a fraction once. Doses add to the depot, not directly to systemic concentration. Initial drug is zero.

`scipy.integrate.solve_ivp` integrates separate dosing intervals using DOP853, relative tolerance 1e-10 and absolute tolerance 1e-11. Integration stops exactly at known dose boundaries before the next depot update. The end of the selected period is a stop boundary, so no new dose is administered at that instant. Dense numerical output supplies sampled results. Roots of dA/dt locate within-interval peaks using `scipy.optimize.brentq`; graph sampling does not define the reported peak. AUC is a state integrated over the selected period, not an infinite-horizon estimate.

Official numerical-method references: [SciPy solve_ivp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html), [SciPy brentq](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html).

## Comparison with analytical solutions

For a single oral dose D and ka ≠ ke:

```
C(t) = F D ka / [V (ka - ke)] × [exp(-ke t) - exp(-ka t)]
```

For equal rates k, the continuous limit is `C(t) = F D k t exp(-k t)/V`. Repeated dosing uses the sum of single-dose responses for the finite schedule. The analytical evaluator uses an equivalent `expm1` expression to avoid subtractive cancellation. This evaluator is used for development comparisons; the application returns numerical integrations.

The automated comparison checks numerical concentration series for single and repeated dosing, equal rates, a slower-absorption example, and the source-based reference example. Acceptance is absolute error ≤ 1e-7 + 1e-8 × |analytical concentration|. Separate analytical comparisons check the single-dose peak/time and finite-period exposure. This implements the paper's analytical-verification objective, without adding an in-application verification report.

Reproduce with:

```
python -m unittest discover -s tests -v
```

Recorded results on 2026-11-27 with Python 3.10, SciPy 1.15.3 and NumPy 2.2.6: all three comparison tests passed. Maximum sampled numerical-versus-analytical concentration error for the default repeated-dose scenario was 2.33e-10 mg/L; for the reference single-dose case it was 2.32e-10 mg/L.

| Numerical result | Default hypothetical, 48 h repeated | Reference illustration, 48 h single |
| --- | ---: | ---: |
| Peak (mg/L) | 2.66021038 | 7.37878356 |
| Time to peak (h) | 41.87334988 | 1.93252200 |
| AUC over 0–48 h (mg·h/L) | 91.04642409 | 96.90220569 |

## Evaluation against published theophylline findings

Primary source: Rovei, Chanoine and Strolin Benedetti, **Pharmacokinetics of theophylline: a dose-range study**, British Journal of Clinical Pharmacology 14 (1982), 769–778. [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC1427546/), [Table 3, page 774](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/1213/1427546/c7d2105f3cfb/brjclinpharm00186-0023.png).

The study used single oral tablet doses of 125, 250, 375 and 500 mg in eight healthy volunteers and fitted one-compartment profiles. Its first-order absorption and approximately dose-proportional exposure support the selected model class in that context. The application does not claim to reproduce individual measurements.

The 250 mg column of Table 3 reports group means: absorption half-life 0.44 h, lag 0.09 h, peak time 1.8 h, peak concentration 8.0 mg/L, elimination half-life 8.1 h, infinite-horizon AUC 108 mg·h/L, clearance 0.041 L/h/kg and volume 0.46 L/kg. The conversion basis is the study's mean mass of 62 kg (Table 1).

The approved representative illustration uses:

- ka = ln(2)/0.44 h;
- V = 0.46 × 62 = 28.52 L;
- CL = 0.041 × 62 = 2.542 L/h;
- ke = CL/V, with half-life derived from ke;
- F = 1 as the explicit complete-bioavailability assumption.

These are a construction from group summaries, not an exact jointly fitted parameter vector. Preserving CL = ke × V gives a 7.776773 h elimination half-life, rather than independently imposing the published mean 8.1 h. The approved simplified model omits the study's small lag.

| Quantity | Published 250 mg group mean | Representative model | Relative difference |
| --- | ---: | ---: | ---: |
| Peak concentration (mg/L) | 8.0 | 7.3788 | −7.77% |
| Peak time (h) | 1.8 | 1.9325 | +7.36% |
| AUC to infinity (mg·h/L) | 108 | 98.3478 | −8.94% |
| Elimination half-life (h) | 8.1 | 7.7768 | −3.99% |

The model's infinite AUC in this table is calculated analytically as F D/CL solely for a like-for-like comparison with the published infinite AUC. The application instead shows the finite selected-period AUC (96.9022 mg·h/L at 48 h); those horizons must not be conflated.

The differences are consistent with using separately averaged inputs, a fixed representative mass, and the simplified no-lag construction. They are not proof of an individual empirical fit, and no acceptance claim is made for clinical prediction. Repeated reference schedules are model extrapolations because this source investigated single doses. This is the applicable published-reference evaluation requested by the paper.

The optional reference concentration band derives from a separate [theophylline label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=78a99bfe-6ebe-4ace-80b0-ee019921435e). It is contextual information, not a validation dataset for the study-based illustration.
