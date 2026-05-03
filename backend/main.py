import cv2
from ultralytics import YOLO
import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import pytz

# 1. เชื่อมต่อ Firebase
try:
    # ไฟล์กุญแจต้องชื่อนี้และอยู่ในโฟลเดอร์ backend เท่านั้น
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase Successfully")
except Exception as e:
    print(f"❌ Firebase Connection Error: {e}")

# 2. โหลดโมเดล YOLOv8m ของพี่
model = YOLO("best.pt")

# 3. ฟังก์ชันบันทึกข้อมูล (ปรับโครงสร้างตามรูป image_17a387.png)
def log_detection(label, confidence, box_coords):
    ist = pytz.timezone('Asia/Kolkata') # เวลาอินเดียตามที่พี่ทำงานอยู่
    now = datetime.datetime.now(ist)
    
    x1, y1, x2, y2 = box_coords
    
    # สร้างโครงสร้างข้อมูลให้เหมือนของเดิมเป๊ะๆ เพื่อให้แอปยอมรับ
    data = {
        "count": 1,
        "date": now.strftime("%Y-%m-%d"),
        "timestamp": now,
        "detections": [
            {
                "label": label,
                "confidence": float(confidence),
                "box": {
                    "x1": float(x1),
                    "y1": float(y1),
                    "x2": float(x2),
                    "y2": float(y2)
                }
            }
        ]
    }
    
    # ส่งไปที่ Collection ชื่อ detection_logs
    db.collection("detection_logs").add(data)
    print(f"🚀 Logged Successfully: {label} ({confidence:.2f})")

# 4. เริ่มเปิดกล้อง
cap = cv2.VideoCapture(0)

print("🔍 ระบบกำลังทำงาน... กด 'q' เพื่อปิดหน้าต่างกล้อง")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    # ตรวจจับวัตถุ (ใช้ imgsz=640 ตามมาตรฐาน YOLOv8)
    results = model.predict(source=frame, conf=0.5, imgsz=640, verbose=False)

    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id]
            conf = box.conf[0]
            # ดึงพิกัด Box
            coords = box.xyxy[0].tolist() 

            # ส่งข้อมูลเมื่อเจอ leopard หรือลองเปลี่ยนเป็น domestic เพื่อเทสหน้าตัวเองก่อนได้ครับ
            if label == 'leopard':
                log_detection(label, conf, coords)
            elif label == 'domestic': # บรรทัดนี้เพิ่มไว้ให้พี่เทสเล่นๆ ว่าข้อมูลเด้งเข้าแอปไหม
                log_detection(label, conf, coords)

    # แสดงผลบนจอคอม
    annotated_frame = results[0].plot()
    cv2.imshow("Leopard Detection System", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()