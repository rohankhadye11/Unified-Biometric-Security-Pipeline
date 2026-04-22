import cv2
import numpy as np
import requests
from ultralytics import YOLO
from deepface import DeepFace
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import threading
import os
import time
from datetime import datetime
import shutil
import csv

# --- Configuration ---
# Set to 0 for local webcam, or use your IP Camera URL
# Replace XX with your phone's actual IP address provided by the IP Camera App
camera_url = "http://192.168.0.105:8080/video"
AUTHORIZED_DIR = "authorized_users"
ALERTS_DIR = "alerts"

# Telegram Settings
TELEGRAM_BOT_TOKEN = "TOKEN_ID"
TELEGRAM_CHAT_ID = "CHAT_ID"
LOG_FILE = "security_log.csv"

# Create necessary directories
os.makedirs(AUTHORIZED_DIR, exist_ok=True)
os.makedirs(ALERTS_DIR, exist_ok=True)

# Application state for the frontend to poll
latest_alert = {
    "filename": None,
    "timestamp": None,
    "status": "System Online - Monitoring"
}

# Ensure there's a placeholder image in authorized directory to prevent DeepFace errors on empty dirs
placeholder = os.path.join(AUTHORIZED_DIR, ".placeholder")
if not os.path.exists(placeholder):
    with open(placeholder, "w") as f:
        f.write("")

# --- FastAPI Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the alerts directory so the React frontend can load the images
app.mount("/alerts", StaticFiles(directory=ALERTS_DIR), name="alerts")

# --- Direct Telegram Alert Feature ---
def send_telegram_alert(image_path):
    if TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE" or TELEGRAM_CHAT_ID == "YOUR_CHAT_ID_HERE":
        print("Telegram alert skipped: Please configure your bot token and chat ID in main.py.")
        return
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "caption": "🚨 INTRUDER ALERT 🚨"}
    
    try:
        with open(image_path, "rb") as image_file:
            files = {"photo": image_file}
            response = requests.post(url, data=payload, files=files)
            if response.status_code == 200:
                print("Telegram alert sent successfully.")
            else:
                print(f"Failed to send Telegram alert: {response.text}")
    except Exception as e:
        print(f"Error sending Telegram alert: {e}")

# --- Vision Engine (Background Thread) ---
def vision_loop():
    global latest_alert
    
    print("Loading AI Models...")
    try:
        model = YOLO('yolov8n.pt')
        # Pre-build facial recognition model so it doesn't freeze on the first detect
        DeepFace.build_model('Facenet')
    except Exception as e:
        print(f"Error loading models: {e}")

    backSub = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)
    
    # Define ROI
    roi_points = np.array([[(100, 100), (500, 100), (600, 400), (50, 400)]], dtype=np.int32)
    
    def initialize_camera(url):
        print(f"Connecting to IP Camera at {url}...")
        cap = cv2.VideoCapture(url)
        # Crucial: Minimize the internal buffer to process the most real-time frame
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap

    cap = initialize_camera(camera_url)

    ret, frame = cap.read()
    while not ret or frame is None:
        print("Waiting for camera feed... Retrying in 2 seconds.")
        time.sleep(2)
        cap = initialize_camera(camera_url)
        ret, frame = cap.read()
        
    height, width = frame.shape[:2]
    roi_mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillPoly(roi_mask, roi_points, 255)

    print("Vision engine running...")
    
    # Cooldown to prevent spamming facial recognition
    last_recognition_time = 0

    while True:
        ret, frame = cap.read()
        
        # --- Robust Error Handling & Reconnection ---
        if not ret or frame is None:
            print("Warning: Connection lost or frame dropped. Attempting to reconnect in 2 seconds...")
            cap.release()
            
            # Wait briefly so we don't spam the network
            time.sleep(2) 
            
            # Attempt to re-establish the connection
            cap = initialize_camera(camera_url)
            continue

        roi_frame = cv2.bitwise_and(frame, frame, mask=roi_mask)
        fgMask = backSub.apply(roi_frame)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_OPEN, kernel)
        
        motion_level = cv2.countNonZero(fgMask)
        
        if motion_level > 500:
            results = model(frame, classes=[0], verbose=False)
            
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                    
                    # Check overlap with ROI
                    box_mask = np.zeros_like(roi_mask)
                    cv2.rectangle(box_mask, (x1, y1), (x2, y2), 255, -1)
                    if cv2.countNonZero(cv2.bitwise_and(box_mask, roi_mask)) > 0:
                        
                        current_time = time.time()
                        # Run facial recognition max once every 3 seconds
                        if current_time - last_recognition_time > 3:
                            # Add padding for better face crop
                            pad = 30
                            y1_p, y2_p = max(0, y1 - pad), min(height, y2 + pad)
                            x1_p, x2_p = max(0, x1 - pad), min(width, x2 + pad)
                            
                            face_crop = frame[y1_p:y2_p, x1_p:x2_p]
                            
                            if face_crop.size > 0:
                                temp_path = "temp_face.jpg"
                                cv2.imwrite(temp_path, face_crop)
                                
                                is_authorized = False
                                
                                # Check against Authorized Faces
                                auth_files = [f for f in os.listdir(AUTHORIZED_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
                                
                                if auth_files:
                                    try:
                                        # Using DeepFace MTCNN backend because YOLO person crops are full-body
                                        # and default OpenCV detector fails to see small faces.
                                        dfs = DeepFace.find(
                                            img_path=temp_path, 
                                            db_path=AUTHORIZED_DIR, 
                                            model_name="Facenet", 
                                            detector_backend="mtcnn",
                                            enforce_detection=True, 
                                            silent=True
                                        )
                                        if len(dfs) > 0 and not dfs[0].empty:
                                            is_authorized = True
                                    except Exception as e:
                                        print(f"Face Error (Ignored): {e}")
                                
                                if is_authorized:
                                    print("Status: Authorized User Detected")
                                    status_color = (0, 255, 0)
                                    status_text = 'Authorized'
                                    latest_alert["status"] = "Authorized Person Recognized"
                                    # Write to CSV
                                    with open(LOG_FILE, 'a', newline='', encoding='utf-8') as f:
                                        csv.writer(f).writerow([datetime.now().isoformat(), "Authorized User", status_text])
                                else:
                                    print("Status: Intruder Alert!")
                                    status_color = (0, 0, 255)
                                    status_text = 'Intruder'
                                    
                                    # Save intruder image
                                    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                                    filename = f"intruder_{ts}.jpg"
                                    alert_path = os.path.join(ALERTS_DIR, filename)
                                    cv2.imwrite(alert_path, face_crop)
                                    
                                    # Send Direct Telegram Alert
                                    # Spawns in a new thread to not lag the video feed while uploading
                                    threading.Thread(target=send_telegram_alert, args=(alert_path,), daemon=True).start()
                                    
                                    # Update global state for FastAPI to serve to React
                                    latest_alert = {
                                        "filename": filename,
                                        "timestamp": datetime.now().isoformat(),
                                        "status": "INTRUDER DETECTED"
                                    }
                                    # Write to CSV
                                    with open(LOG_FILE, 'a', newline='', encoding='utf-8') as f:
                                        csv.writer(f).writerow([datetime.now().isoformat(), "Unknown Intruder", status_text])
                                    
                                last_recognition_time = current_time
                                
                                # Draw bounding box on frame
                                cv2.putText(frame, status_text, (x1, max(10, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, status_color, 2)
                        
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)

        cv2.polylines(frame, [roi_points], isClosed=True, color=(255, 0, 0), thickness=2)
        cv2.imshow('Security Engine', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


# --- API Routes ---
@app.get("/api/latest-alert")
def get_latest_alert():
    return latest_alert

@app.post("/api/register-face")
async def register_face(name: str = Form(...), file: UploadFile = File(...)):
    # Sanitize name
    safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c==' ']).rstrip()
    
    # Save the file
    ext = file.filename.split('.')[-1]
    filename = f"{safe_name.replace(' ', '_')}.{ext}"
    file_path = os.path.join(AUTHORIZED_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Delete the DeepFace cache so it rescans the folder on next run
    for pkl_file in ["representations_facenet.pkl", "representations_vgg_face.pkl"]:
        full_pkl_path = os.path.join(AUTHORIZED_DIR, pkl_file)
        if os.path.exists(full_pkl_path):
            os.remove(full_pkl_path)
        
    return {"message": f"Successfully registered face for {safe_name}"}

@app.get("/api/logs")
def get_logs():
    if not os.path.exists(LOG_FILE):
        return []
        
    logs = []
    try:
        with open(LOG_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 3:
                    logs.append({"timestamp": row[0], "name": row[1], "status": row[2]})
    except Exception as e:
        print(f"Error reading logs: {e}")
        
    # Return reverse chronological order (newest first)
    return logs[::-1]

@app.get("/api/logs/download")
def download_logs():
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'w', newline='', encoding='utf-8') as f:
            csv.writer(f).writerow(["Timestamp", "Name", "Status"])
            
    return FileResponse(path=LOG_FILE, filename="security_log.csv", media_type="text/csv")

@app.on_event("startup")
def startup_event():
    # Start the python CV loop alongside the FastAPI server
    t = threading.Thread(target=vision_loop, daemon=True)
    t.start()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
