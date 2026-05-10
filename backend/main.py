import cv2
from ultralytics import YOLO
import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import pytz
import time
import os

# 1. เชื่อมต่อ Firebase
try:
    base_path = os.path.dirname(os.path.abspath(__file__))
    cert_path = os.path.join(base_path, "serviceAccountKey.json")
    
    if not firebase_admin._apps:
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    print("✅ Connected to Firebase Successfully")
except Exception as e:
    print(f"❌ Firebase Connection Error: {e}")

# 2. โหลดโมเดล YOLO
model_path = os.path.join(base_path, "best.pt")
model = YOLO(model_path)

# ตั้งค่า Cooldown (14 วินาที)
last_alert_time = 0
COOLDOWN_SECONDS = 14 

# 3. ฟังก์ชันบันทึกข้อมูล (ปรับเพื่อรองรับกราฟแท่งเดี่ยวในแอป)
def log_detection(confidence, box_coords):
    global last_alert_time
    current_time = time.time()
    
    # เช็ค Cooldown
    if current_time - last_alert_time < COOLDOWN_SECONDS:
        return

    # ตั้งค่าเวลา India (IST)
    ist = pytz.timezone('Asia/Kolkata') 
    now = datetime.datetime.now(ist)
    
    x1, y1, x2, y2 = box_coords
    
    # ✅ บันทึกเป็น "wild-animal" เพื่อให้แอปนับจำนวนขึ้นกราฟได้ถูกต้อง
    data = {
        "count": 1,
        "date": now.strftime("%Y-%m-%d"),
        "timestamp": now,
        "detections": [
            {
                "label": "wild-animal",
                "confidence": round(float(confidence), 2),
                "box": {
                    "x1": float(x1), "y1": float(y1),
                    "x2": float(x2), "y2": float(y2)
                }
            }
        ]
    }
    
    try:
        db.collection("detection_logs").add(data)
        print(f"🚨 [ALERT] WILD-ANIMAL DETECTED! Conf: {confidence:.2f}")
        last_alert_time = current_time
    except Exception as e:
        print(f"❌ Failed to log to Firebase: {e}")

# 4. เริ่มทำงานระบบตรวจจับผ่านกล้อง
cap = cv2.VideoCapture(0)

print("🔍 Silent Sentry Standby... (Press 'q' to quit)")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    # ✅ ใช้ Confidence 0.7 ตามที่ต้องการ
    results = model.predict(source=frame, conf=0.7, imgsz=640, verbose=False)

    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id].lower()
            conf = float(box.conf[0])
            coords = box.xyxy[0].tolist() 

            # ✅ กรองเฉพาะกลุ่มสัตว์ป่า (wild-animal) ตามหน้างานจริง
            if "wild" in label:
                log_detection(conf, coords)
            else:
                # กรณีเจออย่างอื่น เช่น domestic animal ให้แสดงแค่ใน Terminal ไม่บันทึกลงกราฟ
                print(f"🐾 Detected: {label} ({conf:.2f}) - Monitoring silently...")

    # แสดงผลหน้าจอกล้องพร้อมกรอบ Bounding Box
    annotated_frame = results[0].plot()
    cv2.imshow("Silent Sentry - Backend Monitor", annotated_frame)

    # กด 'q' เพื่อปิดโปรแกรม
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()