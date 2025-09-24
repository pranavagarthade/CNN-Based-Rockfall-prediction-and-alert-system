

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import threading
import time
from twilio.rest import Client

# Load environment variables from .env file early
load_dotenv()

# Twilio credentials from environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")
TWILIO_TO_NUMBER = os.getenv("TWILIO_TO_NUMBER")

# FastAPI app instance
app = FastAPI(title="Rockfall Prediction API", version="1.0")

# --- Image Prediction Helper ---
def predict_image_with_model(image_path):
    model = load_model()
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image file.")
    img = cv2.resize(img, (64, 64))
    img = img.transpose(2, 0, 1)  # HWC to CHW
    img = img.astype(np.float32) / 255.0
    input_tensor = torch.tensor(img).unsqueeze(0)  # (1, C, H, W)
    with torch.no_grad():
        log_probs, probs = model(input_tensor)
        pred = torch.argmax(log_probs, dim=1).item()
        confidence = float(probs[0,1].item())
    rockfall_detected = pred == 1
    return rockfall_detected, confidence



    try:
        rockfall_detected, confidence = predict_image_with_model(temp_path)
    except Exception as e:
        os.remove(temp_path)
        return {"success": False, "error": str(e)}

    try:
        os.remove(temp_path)
    except Exception:
        pass

    # If rockfall detected, send Twilio alert
    if rockfall_detected:
        try:
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            to_numbers = [num.strip() for num in TWILIO_TO_NUMBER.split(',') if num.strip()]
            for to_number in to_numbers:
                if TWILIO_FROM_NUMBER and TWILIO_FROM_NUMBER.startswith('MG'):
                    client.messages.create(
                        body=f"🚨 Rockfall detected in uploaded image! (Confidence: {confidence:.2f}) Immediate action required!",
                        messaging_service_sid=TWILIO_FROM_NUMBER,
                        to=to_number
                    )
                else:
                    client.messages.create(
                        body=f"🚨 Rockfall detected in uploaded image! (Confidence: {confidence:.2f}) Immediate action required!",
                        from_=TWILIO_FROM_NUMBER,
                        to=to_number
                    )
        except Exception as e:
            return {"success": False, "rockfall": True, "alert_sent": False, "error": str(e), "confidence": confidence}
        return {"success": True, "rockfall": True, "alert_sent": True, "confidence": confidence}
    else:
        return {"success": True, "rockfall": False, "alert_sent": False, "confidence": confidence}

from fastapi import Request
from fastapi.responses import StreamingResponse
import json
import asyncio


from fastapi import File, UploadFile
import shutil
import torch
import numpy as np
import cv2

# All imports at the top
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional
import os
from dotenv import load_dotenv
import threading
import time
from twilio.rest import Client
from Feature1 import logic



# Load environment variables from .env file early
load_dotenv()

# Twilio credentials from environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")
TWILIO_TO_NUMBER = os.getenv("TWILIO_TO_NUMBER")



# FastAPI app instance
app = FastAPI(title="Rockfall Prediction API", version="1.0")

# Live monitoring SSE endpoint
@app.get("/live-rockfall-events")
async def live_rockfall_events(request: Request):
    async def event_stream():
        last_idx = 0
        while True:
            # If client disconnects, break
            if await request.is_disconnected():
                break
            # Send new events if available
            global rockfall_events
            if len(rockfall_events) > last_idx:
                for event in rockfall_events[last_idx:]:
                    yield f"data: {json.dumps(event)}\n\n"
                last_idx = len(rockfall_events)
            await asyncio.sleep(2)
    return StreamingResponse(event_stream(), media_type="text/event-stream")


# --- PyTorch Model Loading ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "rockfall_model.pt")
class SimpleCNN(torch.nn.Module):
    def __init__(self, in_channels):
        super(SimpleCNN, self).__init__()
        self.conv1 = torch.nn.Conv2d(in_channels, 16, 3, padding=1)
        self.bn1 = torch.nn.BatchNorm2d(16)
        self.conv2 = torch.nn.Conv2d(16, 32, 3, padding=1)
        self.bn2 = torch.nn.BatchNorm2d(32)
        self.conv3 = torch.nn.Conv2d(32, 2, 1)
        self.logsoftmax = torch.nn.LogSoftmax(dim=1)
        self.softmax = torch.nn.Softmax(dim=1)
    def forward(self, x):
        x = torch.relu(self.bn1(self.conv1(x)))
        x = torch.relu(self.bn2(self.conv2(x)))
        out = self.conv3(x)
        log_prob = self.logsoftmax(out)
        prob = self.softmax(out)
        return log_prob, prob

def load_model():
    channels = 3  # Assume RGB frames
    model = SimpleCNN(in_channels=channels)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
    model.eval()
    return model

def extract_frames(video_path, num_frames=8):
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    idxs = np.linspace(0, total-1, num_frames, dtype=int)
    frames = []
    for idx in idxs:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        frame = cv2.resize(frame, (64, 64))
        frame = frame.transpose(2, 0, 1)  # HWC to CHW
        frames.append(frame)
    cap.release()
    return np.stack(frames) if frames else None

def predict_video_with_model(video_path):
    model = load_model()
    frames = extract_frames(video_path)
    if frames is None or len(frames) == 0:
        return False, 0.0
    # Normalize frames
    frames = frames.astype(np.float32) / 255.0
    inputs = torch.tensor(frames)
    # Model expects (B, C, H, W)
    with torch.no_grad():
        log_probs, probs = model(inputs)
        preds = torch.argmax(log_probs, dim=1)
        # If any frame is predicted as class 1 (rockfall/critical), trigger alert
        rockfall_detected = (preds == 1).any().item()
        confidence = float(probs[:,1].max().item())
    return rockfall_detected, confidence




# In-memory store for demo rockfall events (replace with DB or real logic in production)
rockfall_events = []

# Demo: Add a test event every 30 seconds (for demo/testing only)
def event_generator():
    mine_names = ["Jharia Coalfield", "Korba Coalfield", "Singareni Collieries", "Mahanadi Coalfield"]
    idx = 0
    while True:
        time.sleep(30)
        event = {"mine": mine_names[idx % len(mine_names)], "timestamp": time.time()}
        rockfall_events.append(event)
        idx += 1

@app.on_event("startup")
def start_event_thread():
    t = threading.Thread(target=event_generator, daemon=True)
    t.start()

# Endpoint to get current/active rockfall events
@app.get("/rockfall-events")
def get_rockfall_events():
    # Return and clear all events (simulate one-time alert)
    global rockfall_events
    events = rockfall_events[:]
    rockfall_events = []
    return {"events": events}

# Emergency alert endpoint (must be after app is defined)
@app.post("/emergency-alert", summary="Send emergency alert via Twilio")
def send_emergency_alert():
    import sys
    print("[Twilio Debug] SID:", TWILIO_ACCOUNT_SID, file=sys.stderr)
    print("[Twilio Debug] TOKEN:", 'SET' if TWILIO_AUTH_TOKEN else 'MISSING', file=sys.stderr)
    print("[Twilio Debug] FROM:", TWILIO_FROM_NUMBER, file=sys.stderr)
    print("[Twilio Debug] TO:", TWILIO_TO_NUMBER, file=sys.stderr)
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_TO_NUMBER]):
        print("[Twilio Debug] Missing credentials", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Twilio credentials are not set in environment variables.")
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        to_numbers = [num.strip() for num in TWILIO_TO_NUMBER.split(',') if num.strip()]
        message_sids = []
        call_sids = []
        for to_number in to_numbers:
            # --- Send SMS Alert ---
            try:
                if TWILIO_FROM_NUMBER and TWILIO_FROM_NUMBER.startswith('MG'):
                    message = client.messages.create(
                        body="🚨 Emergency Alert: Immediate action required at the mine site!",
                        messaging_service_sid=TWILIO_FROM_NUMBER,
                        to=to_number
                    )
                else:
                    message = client.messages.create(
                        body="🚨 Emergency Alert: Immediate action required at the mine site!",
                        from_=TWILIO_FROM_NUMBER,
                        to=to_number
                    )
                print(f"[Twilio Debug] Message SID for {to_number}: {message.sid}", file=sys.stderr)
                message_sids.append({"to": to_number, "sid": message.sid})
            except Exception as sms_err:
                print(f"[Twilio Debug] SMS error for {to_number}: {sms_err}", file=sys.stderr)
                message_sids.append({"to": to_number, "sid": None, "error": str(sms_err)})

            # --- Send Voice Call Alert ---

            try:
                english_message = "This is an emergency. Please move to the safe place from the mine."
                # Repeat the message 3 times in English
                twiml = f'''
<Response>
    <Say voice="alice">{english_message}</Say>
    <Say voice="alice">{english_message}</Say>
    <Say voice="alice">{english_message}</Say>
</Response>
'''
                call = client.calls.create(
                    twiml=twiml,
                    to=to_number,
                    from_=TWILIO_FROM_NUMBER
                )
                print(f"[Twilio Debug] Call SID for {to_number}: {call.sid}", file=sys.stderr)
                call_sids.append({"to": to_number, "sid": call.sid})
            except Exception as call_err:
                print(f"[Twilio Debug] Call error for {to_number}: {call_err}", file=sys.stderr)
                call_sids.append({"to": to_number, "sid": None, "error": str(call_err)})

        return {
            "success": True,
            "messages": message_sids,
            "calls": call_sids,
            "detail": f"Emergency alert (SMS and voice) sent to {len(to_numbers)} number(s)."
        }
    except Exception as e:
        print(f"[Twilio Debug] Exception: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Failed to send emergency alert: {str(e)}")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify a list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to Rockfall Prediction API",
        "version": "1.0",
        "supported_rock_types": list(ROCK_TYPE_ENCODING.keys())
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Rockfall Prediction API is running",
        "model_loaded": os.path.exists("/home/lenovo/Desktop/OtherOpenSource/GeoGurdians-SIH/backend/rockfall_model.pt")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)