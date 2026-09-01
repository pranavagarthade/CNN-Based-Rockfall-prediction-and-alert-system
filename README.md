# CNN-Based Rockfall Prediction & Alert System

A CNN-based system that predicts rockfall risk from [imagery type — e.g. terrain photos / satellite imagery / drone footage] and maps predicted risk zones geographically. Built as a final-year project spanning a machine learning service, backend, and frontend.

## Current Status

This project is **not fully complete** — being upfront about scope here rather than in a follow-up question:

| Component | Status |
|---|---|
| CNN risk prediction model | ✅ Implemented |
| Geolocation mapping of predictions | ✅ Implemented |
| Backend + frontend integration | ✅ Implemented |
| Real-time sensor-triggered alerting | ⬜ Not yet implemented — planned next phase |

## Features

- CNN-based classification of [rockfall-prone terrain / rock face imagery] into risk categories
- Geolocation mapping of predicted risk zones on [map service used]
- [Dashboard / interface] for viewing predictions and locations
- *(Planned)* Automated alert triggering from live sensor data

## Tech Stack

- **Frontend:** [React / plain JS / other — from your `frontend/` folder]
- **Backend:** [Node.js + Express / other — from your `backend/` folder]
- **Machine Learning:** [TensorFlow / Keras / PyTorch], CNN architecture — [custom / transfer learning from X base model]
- **Mapping:** [Google Maps API / Leaflet / other]
- **Database:** [if any]

## Repository Structure

```
├── backend/          # API server, handles [routing predictions / storing geolocation data]
├── frontend/         # User-facing interface for viewing predictions on a map
├── machineLearning/  # CNN model training + inference code
```

## Dataset

- Source: [Kaggle dataset name / self-collected / satellite imagery source]
- Size: [X images], split [train/val/test ratio]
- **Class imbalance:** Rockfall events are rare relative to normal terrain images, which produced an imbalanced dataset. Addressed via [data augmentation / oversampling / transfer learning — whichever you actually used], improving [accuracy / precision / recall] to [X%].

## Build Challenges & Technical Obstacles

**1. Data labeling and class imbalance**
[X images from Y source] resulted in far fewer positive (rockfall) examples than negative ones. This was handled by [technique used], which changed [metric] from [before] to [after].

**2. Integrating the ML model, backend, and frontend**
The three components were built separately, and connecting them surfaced [the actual issue — e.g. inference latency, mismatched image formats between frontend upload and model input, API timeout handling]. Resolved by [what you changed].

## Known Limitations

- Sensor-to-alert integration is not yet implemented — predictions currently require manual review rather than triggering automated alerts.
- [Any other honest limitation — e.g. dataset size, real-time performance, geographic coverage]

## Setup & Installation

```bash
# Clone the repo
git clone https://github.com/pranavagarthade/CNN-Based-Rockfall-prediction-and-alert-system.git

# Backend
cd backend
npm install
npm start

# Frontend
cd ../frontend
npm install
npm start

# Machine Learning service
cd ../machineLearning
pip install -r requirements.txt
python [main script name].py
```

*(Adjust commands above to match what your `backend/`, `frontend/`, and `machineLearning/` folders actually use — package manager, entry point files, and required environment variables.)*

## Roadmap

- [ ] Integrate live sensor data to trigger automated alerts
- [ ] Expand dataset for improved generalization
- [ ] [Other planned work]

## Author

Pranav Agarthade
