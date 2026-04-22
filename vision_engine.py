import cv2
import numpy as np
from ultralytics import YOLO

# Configuration
# Replace with your mobile IP Camera URL (e.g., 'http://192.168.1.100:8080/video')
# If you want to use your local webcam for testing, set this to 0.
CAMERA_URL = 0 

# Load the YOLOv8-nano model (it will be downloaded automatically the first time)
model = YOLO('yolov8n.pt')

# Initialize Background Subtractor (MOG2)
backSub = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)

# Define a Polygon Region of Interest (ROI)
# Adjust these coordinates based on your camera view. 
# This example is a quadrilateral roughly in the center-bottom of a 640x480 frame.
roi_points = np.array([[(100, 100), (500, 100), (600, 400), (50, 400)]], dtype=np.int32)

def check_overlap(box, roi_mask):
    """Check if the bounding box overlaps with the ROI mask."""
    x1, y1, x2, y2 = map(int, box)
    box_mask = np.zeros_like(roi_mask)
    cv2.rectangle(box_mask, (x1, y1), (x2, y2), 255, -1)
    intersection = cv2.bitwise_and(box_mask, roi_mask)
    return cv2.countNonZero(intersection) > 0

def main():
    cap = cv2.VideoCapture(CAMERA_URL)

    if not cap.isOpened():
        print("Error: Could not open camera stream.")
        return

    # Read the first frame to get dimensions
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not read the first frame.")
        return
        
    height, width = frame.shape[:2]
    
    # Create the ROI mask
    roi_mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillPoly(roi_mask, roi_points, 255)

    print("Vision engine started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        # 1. Apply ROI: Mask the frame for motion detection
        roi_frame = cv2.bitwise_and(frame, frame, mask=roi_mask)

        # 2. Background subtraction to detect motion
        fgMask = backSub.apply(roi_frame)
        
        # Remove noise with morphology (erosion + dilation)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_OPEN, kernel)
        
        # 3. Check motion level
        motion_level = cv2.countNonZero(fgMask)
        
        # If motion exceeds a threshold, run YOLO
        if motion_level > 500: # Adjust threshold as needed
            # Run YOLOv8 inference on the original unmasked frame
            results = model(frame, classes=[0], verbose=False) # class 0 is 'person'
            
            for result in results:
                for box in result.boxes:
                    # Bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    # 4. Verify if the person is inside the ROI
                    if check_overlap((x1, y1, x2, y2), roi_mask):
                        print("Human Detected within ROI")
                        
                        # Draw bounding box and label
                        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                        cv2.putText(frame, 'Human', (int(x1), int(y1) - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        # Visualization: Draw the ROI polygon on the frame
        cv2.polylines(frame, [roi_points], isClosed=True, color=(255, 0, 0), thickness=2)

        # Display the output windows
        cv2.imshow('Vision Engine - RGB', frame)
        cv2.imshow('Motion Mask', fgMask)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()