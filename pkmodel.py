"""Oral depot + one systemic compartment, units mg, L, h, mg/L."""
from dataclasses import asdict, dataclass
from math import exp, expm1, isfinite, log

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import brentq


@dataclass(frozen=True)
class Parameters:
    dose: float = 100
    interval: float = 8
    ka: float = 1
    half: float = 6
    bio: float = 80
    volume: float = 40
    duration: float = 48
    repeated: bool = True
    scenario: str = "hypothetical"

    @property
    def ke(self):
        return log(2) / self.half


LIMITS = {"dose": (0, 1000), "interval": (1, 24), "ka": (.05, 5),
          "half": (.5, 48), "bio": (0, 100), "volume": (1, 200), "duration": (1, 168)}
REFERENCE = {"ka": log(2) / .44, "half": log(2) / (.041 / .46), "bio": 100, "volume": .46 * 62}


def parameters(payload):
    if not isinstance(payload, dict):
        raise ValueError("Simulation parameters must be an object.")
    if set(payload) - set(Parameters.__dataclass_fields__):
        raise ValueError("Unknown simulation parameter.")
    values = asdict(Parameters()) | payload
    if values["scenario"] not in ("hypothetical", "reference", "inspired"):
        raise ValueError("Unknown scenario.")
    if type(values["repeated"]) is not bool:
        raise ValueError("Dosing mode must be true or false.")
    for key, (lo, hi) in LIMITS.items():
        v = values[key]
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not isfinite(v) or not lo <= v <= hi:
            raise ValueError(f"{key} must be a finite number between {lo} and {hi}.")
    if values["scenario"] == "reference":
        # The server, not just the UI, protects source-defined pharmacokinetics.
        values.update(REFERENCE)
        if values["dose"] not in (125, 250, 375, 500):
            raise ValueError("Reference doses are 125, 250, 375 or 500 mg. Use the sandbox for other doses.")
    return Parameters(**values)


def dose_times(p):
    # End time is a stop boundary: do not administer a new dose at that instant.
    return [float(i * p.interval) for i in range(int(np.ceil(p.duration / p.interval)))] if p.repeated else [0.0]


def analytical(t, p):
    """Stable Bateman solution, superposed over the finite dose schedule."""
    total = 0.0
    delta = abs(p.ka - p.ke)
    for ti in dose_times(p):
        if ti > t:
            break
        age = t - ti
        factor = age if delta < 1e-12 else -expm1(-delta * age) / delta
        total += p.bio / 100 * p.dose * p.ka / p.volume * exp(-min(p.ka, p.ke) * age) * factor
    return total


def simulate(p):
    """Integrate each uninterrupted dosing interval; derive extrema from dense output."""
    doses = dose_times(p)
    boundaries = doses + [float(p.duration)]
    state = np.zeros(3)  # gut amount, systemic amount, integrated concentration
    segments = []
    peaks = [(0.0, 0.0)]
    troughs = []
    bio = p.bio / 100

    def rhs(t, y):
        return [-p.ka * y[0], bio * p.ka * y[0] - p.ke * y[1], y[1] / p.volume]

    for start, end in zip(boundaries, boundaries[1:]):
        state[0] += p.dose
        solution = solve_ivp(rhs, (start, end), state, method="DOP853", dense_output=True,
                             rtol=1e-10, atol=1e-11)
        if not solution.success:
            raise RuntimeError("The numerical simulation could not converge.")
        evaluate = solution.sol
        segments.append((start, end, evaluate))
        slope = lambda t: rhs(t, evaluate(t))[1]
        candidates = [start, end]
        if slope(start) > 0 and slope(end) < 0:
            candidates.append(brentq(slope, start, end, xtol=1e-11))
        peaks.extend((float(evaluate(t)[1] / p.volume), float(t)) for t in candidates)
        state = evaluate(end)
        if p.repeated and end in doses[1:]:
            troughs.append({"time": end, "concentration": max(0.0, float(state[1] / p.volume))})

    peak, peak_time = max(peaks, key=lambda row: row[0])
    if p.dose == 0 or p.bio == 0:
        peak, peak_time = 0.0, 0.0
    # Include extrema and exact events in the display grid; metrics do not depend on grid resolution.
    times = np.unique(np.concatenate((np.linspace(0, p.duration, 1401), doses, [peak_time])))
    series = []
    for i, (start, end, evaluate) in enumerate(segments):
        selected = times[(times >= start) & ((times < end) if i < len(segments) - 1 else (times <= end))]
        result = evaluate(selected)
        for t, gut, amount in zip(selected, result[0], result[1]):
            series.append([float(t), max(0.0, float(amount / p.volume)), max(0.0, float(gut))])
    return {"parameters": asdict(p), "series": series, "doses": doses,
            "metrics": {"peak": peak, "peak_time": peak_time, "auc": max(0.0, float(state[2])),
                        "latest_trough": troughs[-1]["concentration"] if troughs else None,
                        "troughs": troughs},
            "units": {"time": "h", "concentration": "mg/L", "gut": "mg", "auc": "mg·h/L"}}
