# Unified Biometric Security Pipeline

This project is an end-to-end, edge-based computer vision pipeline that transforms passive security cameras into an active threat detection system. It automatically ingests live video feeds, detects human presence, cross-references faces against a local database, and instantly pushes alerts to a mobile device. The system features a centralized full-stack dashboard for live monitoring and historical access logging.

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Technologies Used](#3-technologies-used)
4. [Architecture](#4-architecture)
5. [Demonstration Screenshots](#5-demonstration-screenshots)
6. [Usage](#6-usage)
7. [System & Compute Considerations](#7-system--compute-considerations)

## 1. Project Overview
The Unified Biometric Security Pipeline is designed to solve the notification fatigue inherent in traditional smart cameras. By utilizing advanced deep metric learning and custom debouncing algorithms, the system accurately distinguishes between authorized personnel and unknown intruders. It bridges the gap between complex Python-based computer vision engines and modern, user-friendly enterprise SaaS interfaces.

## 2. Features
* **Real-Time Threat Detection:** Utilizes single-stage object detection (YOLOv8) for hyper-fast human localization before triggering heavier facial recognition models.
* **Intelligent Debouncing (Anti-Spam):** Implements a custom state-memory dictionary and cooldown timer to suppress duplicate alerts for the same person, ensuring clean data and preventing notification fatigue.
* **Instant Mobile Alerting:** Integrates directly with the Telegram Bot API to send critical "Intruder Alerts" complete with high-resolution bounding-box snapshots directly to the administrator's phone.
* **Automated Audit Logging:** Silently records every authorized entry and unauthorized intrusion into a structured CSV database, acting as a lightweight data lake for downstream BI analysis.
* **Enterprise Security Dashboard:** Features a secure, multi-page React web application that visualizes the CSV access logs and provides a commercial-grade UI for security monitoring.

## 3. Technologies Used
**Computer Vision & AI Engine:**
* Python 3.x
* OpenCV (Image processing, matrix manipulation, affine transformations)
* YOLOv8 (Human object detection)
* DeepFace (MTCNN for face detection/alignment, VGG-Face/Facenet for vector embeddings and Cosine Similarity matching)

**Backend & Integration:**
* FastAPI (RESTful API development)
* Python `requests` library
* Telegram Bot API (Direct notification routing)

**Frontend Dashboard:**
* React 18 (Vite)
* React Router DOM (Multi-page navigation)
* Tailwind CSS (Enterprise UI/UX styling)
* Lucide React (System iconography)

## 4. Architecture
The system follows a decoupled, edge-computing architecture, ensuring the heavy visual processing is handled locally while the reporting is accessible via modern web protocols.
![Architecture](https://github.com/rohankhadye11/Unified-Biometric-Security-Pipeline/blob/main/Snapshot%20of%20Project%20Architecture.png)
**Key Components & Interactions:**
* **The Vision Engine (Python):** Ingests frames from the IP camera. It passes frames through YOLOv8. If a human is detected, the region of interest is cropped and sent to DeepFace. 
* **The Logic Controller:** If DeepFace matches the embedding to the `/authorized_users/` directory, it passes. If unknown, the system checks the Debouncer. If the cooldown has cleared, it triggers the Alerting Module.
* **The Data Layer:** Every processed event (Authorized or Intruder) is written to `security_log.csv` with an exact datetime stamp.
* **The API Bridge (FastAPI):** A lightweight server that reads the local CSV file and serves it as JSON endpoints (`/api/logs`) to the web frontend.
* **The UI (React):** Consumes the FastAPI endpoints to display a real-time, interactive data table with an "Export to CSV" function for further analytics (e.g., Power BI).

## 5. Demonstration Screenshots

This section highlights the React and Tailwind CSS frontend, demonstrating how the raw computer vision data is transformed into a commercial-grade Security Operations Center (SOC).

**Screenshot 1: Security Operations Command Center**
![Dashboard](https://github.com/rohankhadye11/Unified-Biometric-Security-Pipeline/blob/main/Snapshot%20of%20Dashboard.png)*
* **Description:** The primary dashboard interface featuring a dark-theme, enterprise SaaS aesthetic. It includes real-time telemetry through dynamic metric cards (Total Scans, Threat Levels, Active Zones), a Live Threat Feed monitoring interface, and a seamless "Personnel Registration" module allowing administrators to authorize new biometric identities directly from the web portal.

**Screenshot 2: Interactive Security Event Log**
![Security_logs](https://github.com/rohankhadye11/Unified-Biometric-Security-Pipeline/blob/main/Snapshot%20of%20Security%20Logs.png)*
* **Description:** The centralized auditing interface. This view successfully bridges the Python backend's CSV logging with the frontend, displaying a color-coded, time-stamped history of all access events. The clear visual distinction between "Authorized" and "Intruder" statuses reduces cognitive load, and the dedicated "Export CSV" functionality enables instant data offloading for downstream BI analysis.

## 6. Usage
**1. Start the Vision Engine:**
* Place known faces in the `/authorized_users/` directory.
* Run `python main_vision.py` to activate the IP camera, YOLOv8, and the event-logging loop.

**2. Start the Backend API:**
* Run `uvicorn main:app --reload` to start the FastAPI server on `localhost:8000`.

**3. Launch the Frontend:**
* Navigate to the React directory and run `npm run dev`.
* Open your browser to view the Security Operations Center dashboard.

## 7. System & Compute Considerations
Unlike cloud-reliant architectures, this pipeline operates entirely on the edge, meaning **there are zero recurring cloud computing costs.**
* **Compute:** Real-time object detection (YOLOv8) is computationally heavy. Running the Vision Engine on a machine with a dedicated GPU (NVIDIA/CUDA) is highly recommended for 30+ FPS performance, though it will run at a lower framerate on modern CPUs.
* **Storage:** The CSV logging format is incredibly lightweight, requiring mere kilobytes for thousands of entries. Intruder alert images are saved locally to an `/alerts/` folder, which should be periodically archived or purged.
* **External Services:** The Telegram Bot API is entirely free to use but requires an active internet connection to route the HTTP POST requests.
