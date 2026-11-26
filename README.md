# Small Dose

Local pharmacokinetics simulation with a pixel art interface. Python integrates an oral absorption depot and one systemic compartment. The browser displays the same numerical results in the graph, readouts and body animation.

## Run locally

Use Python 3.10–3.13 (tested with 3.10). From this directory:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py --open
```

After setup, double-click `start.cmd` or run `python app.py --open` with the dependencies installed. Open [Small Dose](http://localhost:8766). Use `--port 8767` if needed. Stop the server with Ctrl+C. Assets and simulations run locally; internet is only needed to install packages or open external source links.

## Application

- Hypothetical sandbox with adjustable dosing, absorption, elimination half-life, bioavailability, distribution volume and duration.
- Source-based Theophylline preset. Changing a parameter or dosing mode automatically switches to **Theophylline - Modified**; selecting Theophylline restores the reference values.
- Concentration graph, dose markers, time scrubbing, playback, optional reference/illustrative bands and a pinned comparison curve. Includes gut-reservoir and absorption-flow graph tabs.
- Numerical peak, time to peak, latest completed between-dose trough, and finite-period AUC.
- The approved warm pixel interface, folder tabs and direct graphic controls. Rose tint follows one systemic concentration; the amber pulse follows absorption. The display does not calculate organ-specific concentrations.

There are no exports, tutorials, accounts or in-app reports. Experiment state is kept in memory and resets when the page reloads.

## Source layout

- `pkmodel.py`: model, parameters, numerical integration and analytical comparison function.
- `app.py`: loopback HTTP service and local static assets.
- `web/app.js`: controls, API requests, numerical-series interpolation and playback.
- `web/anatomy.js`: original schematic pixel anatomy and animation.
- `web/chart.js`: graph of Python results.
- `web/base.css`, `web/theme.css`: approved interface styling.

## Paper-aligned verification

```powershell
python -m unittest discover -s tests -v
```

These comparisons verify the numerical implementation against analytical oral single/repeated-dose solutions, peak timing and finite-period exposure. See [research notes](docs/research-comparison.md) for published-reference evaluation and the study-summary construction. No clinical validation is claimed.

The local server binds to `127.0.0.1`; it is intended for local study demonstrations, not public hosting.
