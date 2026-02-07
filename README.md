# Chess Analysis Kit

A real-time chess analysis application powered by the Stockfish engine. Play moves on an interactive board and instantly see engine evaluations, top continuation lines, and best move arrows — or import any PGN game to step through and analyze move by move.

![Architecture](#architecture)

## Features

- **Interactive chessboard** with drag-and-drop and click-to-move support
- **Real-time Stockfish analysis** with configurable depth (1–30) and multi-PV lines
- **Evaluation bar** showing advantage with smooth animated transitions
- **PGN import** — paste any PGN to replay and analyze full games
- **Move navigation** with keyboard arrow keys and clickable move list
- **Board controls** — flip orientation, start new game
- **WebSocket communication** for low-latency analysis updates

## Tech Stack

### Frontend
- **React 19** with Vite for fast HMR and optimized production builds
- **Tailwind CSS 4** for utility-first styling
- **react-chessboard** and **chess.js** for board rendering and move validation
- **Socket.IO Client** for real-time WebSocket communication

### Backend
- **Flask** with **Flask-SocketIO** for REST and WebSocket endpoints
- **Stockfish 17** chess engine via subprocess communication
- **python-chess** for FEN validation, PGN parsing, and UCI-to-SAN move conversion
- **Eventlet** for async WebSocket handling

### Infrastructure
- **Docker** — multi-stage frontend build (Node + nginx), backend with Stockfish pre-installed
- **Helm** — parameterized Kubernetes chart under `helm/chess-app/`
- **ArgoCD** — GitOps continuous delivery with auto-sync and self-heal
- **Kubernetes** — deployed on OrbStack (local) with NodePort services

### Observability

- **Prometheus** — metrics collection with custom scrape config for the backend
- **Grafana** — pre-provisioned dashboard with request rates, latency percentiles, analysis duration, and error tracking
- **prometheus_client** — custom metrics (analysis request counter, duration histogram) exposed at `/metrics`
- **Fluent Bit** — DaemonSet log collector with Kubernetes metadata enrichment, ready for AWS CloudWatch
- **Structured JSON logging** — backend emits JSON logs for machine-parseable log aggregation

## Architecture

```
                        +------------------+
                        |     Browser      |
                        +--------+---------+
                                 |
                  +--------------+--------------+
                  |                             |
           localhost:30080                localhost:30501
                  |                             |
         +-------+--------+          +---------+----------+
         |  Frontend Pod   |          |   Backend Pod      |
         |  (nginx)        |          |   (Flask+SocketIO) |
         |  - React SPA    |  WS/HTTP |   - Stockfish      |
         |  - Static assets| -------> |   - python-chess   |
         +----------------+          +--------------------+
                  |                             |
         Helm Managed              Helm Managed
                  |                             |
         +--------+----------------------------+--------+
         |              ArgoCD (GitOps)                  |
         |  auto-sync from main branch                   |
         +-----------------------------------------------+
                              |
         +--------------------+------------------------+
         |            Monitoring Stack                  |
         |  Prometheus (:30090)  ←  scrape /metrics     |
         |  Grafana (:30300)     ←  dashboards          |
         +----------------------------------------------+
                              |
         +--------------------+------------------------+
         |            Logging Stack                     |
         |  Fluent Bit (DaemonSet)                      |
         |  tail /var/log/containers → stdout           |
         |  (→ CloudWatch on AWS)                       |
         +----------------------------------------------+
```

## Local Setup

### Prerequisites

| Tool | Purpose |
|------|---------|
| [Docker](https://docs.docker.com/get-docker/) | Build container images |
| [OrbStack](https://orbstack.dev/) (or any local K8s) | Run Kubernetes locally |
| [Helm](https://helm.sh/docs/intro/install/) | Deploy the Helm chart |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | Interact with the cluster |

### 1. Build Docker Images

```bash
# From the project root
docker build -t chess-frontend:latest ./frontend
docker build -t chess-backend:latest ./backend
```

### 2. Deploy with Helm

```bash
helm install chess-app ./helm/chess-app
```

Or apply the raw manifests with ArgoCD:

```bash
# Install ArgoCD (one-time)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Expose ArgoCD UI
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30443}]}}'

# Deploy the app via ArgoCD
kubectl apply -f helm/argocd-app.yaml
```

### 3. Deploy Monitoring (Optional)

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install Prometheus + Grafana
helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f helm/prometheus-values.yaml
```

A pre-built Grafana dashboard is auto-provisioned via ConfigMap when ArgoCD syncs the Helm chart.

### 4. Deploy Logging (Optional)

```bash
# Add Helm repo
helm repo add fluent https://fluent.github.io/helm-charts

# Install Fluent Bit
helm install fluent-bit fluent/fluent-bit \
  --namespace logging --create-namespace \
  -f helm/fluent-bit-values.yaml
```

Fluent Bit collects container logs as a DaemonSet, enriches them with Kubernetes metadata, and outputs to stdout. Switch to CloudWatch by uncommenting the output block in `helm/fluent-bit-values.yaml`.

### 5. Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:30080 |
| Backend Health | http://localhost:30501/health |
| ArgoCD UI | https://localhost:30443 |
| Prometheus | http://localhost:30090 |
| Grafana | http://localhost:30300 |

ArgoCD default credentials:
- **Username:** `admin`
- **Password:** `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

Grafana default credentials:
- **Username:** `admin`
- **Password:** `kubectl -n monitoring get secret kube-prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d`

### Running Without Kubernetes

If you just want to run the app locally without containers:

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Ensure Stockfish is installed: brew install stockfish (macOS)
python app.py

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and connects to the backend at `http://localhost:5001`.

## Project Structure

```
chess-analysis-kit/
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── App.jsx          # Main app — board, controls, state
│   │   ├── components/
│   │   │   ├── AnalysisPanel.jsx   # Engine lines display
│   │   │   ├── EvalBar.jsx         # Evaluation bar
│   │   │   ├── MoveList.jsx        # PGN move navigator
│   │   │   ├── PgnInput.jsx        # PGN import form
│   │   │   └── ui/                 # Reusable UI primitives
│   │   └── lib/
│   ├── Dockerfile           # Multi-stage: Node build + nginx
│   └── nginx.conf
├── backend/
│   ├── app.py               # Flask + SocketIO server
│   ├── engine.py            # Stockfish subprocess wrapper
│   ├── config.py            # Engine configuration
│   ├── requirements.txt
│   └── Dockerfile           # Python + Stockfish
├── helm/
│   ├── chess-app/           # Helm chart
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── backend-deployment.yaml
│   │       ├── backend-service.yaml
│   │       ├── frontend-deployment.yaml
│   │       ├── frontend-service.yaml
│   │       └── grafana-dashboard-cm.yaml  # Auto-provisioned dashboard
│   ├── argocd-app.yaml      # ArgoCD Application CR
│   ├── prometheus-values.yaml  # Prometheus + Grafana config
│   └── fluent-bit-values.yaml  # Fluent Bit log collector config
└── README.md
```
