"""Verification required by the paper: numerical versus analytical solutions."""
import math
import unittest

from pkmodel import analytical, parameters, simulate


class AnalyticalComparison(unittest.TestCase):
    def test_numerical_matches_analytical(self):
        cases = [
            {"repeated": False},
            {},
            {"ka": math.log(2) / 6, "repeated": False},
            {"ka": math.log(2) / 6},
            {"ka": .1, "half": 1, "duration": 72, "interval": 6},
            {"scenario": "reference", "dose": 250, "repeated": False},
        ]
        for payload in cases:
            with self.subTest(payload=payload):
                p = parameters(payload)
                result = simulate(p)
                for t, concentration, _ in result["series"]:
                    expected = analytical(t, p)
                    self.assertLessEqual(abs(concentration - expected), 1e-7 + 1e-8 * abs(expected))

    def test_single_dose_peak_matches_analytical_peak(self):
        p = parameters({"repeated": False})
        time = math.log(p.ka / p.ke) / (p.ka - p.ke)
        metrics = simulate(p)["metrics"]
        self.assertAlmostEqual(metrics["peak_time"], time, places=7)
        self.assertAlmostEqual(metrics["peak"], analytical(time, p), places=8)

    def test_finite_auc_matches_analytical_integral(self):
        from scipy.integrate import quad
        for repeated in (False, True):
            p = parameters({"repeated": repeated})
            expected, _ = quad(lambda t: analytical(t, p), 0, p.duration,
                               points=[t for t in simulate(p)["doses"] if t > 0], epsabs=1e-9)
            self.assertAlmostEqual(simulate(p)["metrics"]["auc"], expected, places=7)


if __name__ == "__main__":
    unittest.main()
