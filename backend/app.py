from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional
import os
from dotenv import load_dotenv



# Load environment variables from .env file early
load_dotenv()

# Import your logic module
from Feature1 import logic

app = FastAPI(title="Rockfall Prediction API", version="1.0")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify a list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rock type encoding mapping (adjust based on your training data)
ROCK_TYPE_ENCODING = {
    "granite": 1,
    "limestone": 2,
    "sandstone": 3,
    "shale": 4,
    "quartzite": 5,
    "slate": 6,
    "marble": 7,
    "basalt": 8,
    "andesite": 9,
    "other": 0
}

# Pydantic model for input validation
class RockfallInput(BaseModel):
    X: float = Field(..., example=500.0, description="X coordinate in meters")
    Y: float = Field(..., example=400.0, description="Y coordinate in meters")
    Z: float = Field(..., example=50.0, description="Z elevation in meters")
    Rock_Type: str = Field(..., example="Granite", description="Type of rock formation")
    Ore_Grade_percent: float = Field(..., alias='Ore_Grade (%)', example=35.0, description="Ore grade percentage")
    Tonnage: float = Field(..., example=1200.0, description="Tonnage in tonnes")
    Ore_Value_per_tonne: float = Field(..., alias='Ore_Value (¥/tonne)', example=50.0, description="Ore value per tonne")
    Mining_Cost: float = Field(..., alias='Mining_Cost (¥)', example=30.0, description="Mining cost")
    Processing_Cost: float = Field(..., alias='Processing_Cost (¥)', example=15.0, description="Processing cost")

    @validator('Rock_Type')
    def valid_rock_type(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError('Rock_Type must be a non-empty string')
        return v.strip().lower()  # Normalize to lowercase for encoding

    @validator('Ore_Grade_percent')
    def valid_ore_grade(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Ore grade must be between 0 and 100')
        return v

    @validator('Tonnage')
    def valid_tonnage(cls, v):
        if v <= 0:
            raise ValueError('Tonnage must be positive')
        return v

def encode_rock_type(rock_type: str) -> int:
    """Convert rock type string to encoded integer"""
    normalized = rock_type.strip().lower()
    return ROCK_TYPE_ENCODING.get(normalized, 0)  # Default to 0 for unknown types

@app.get("/")
def root():
    return {
        "message": "Welcome to Rockfall Prediction API",
        "version": "1.0",
        "supported_rock_types": list(ROCK_TYPE_ENCODING.keys())
    }

@app.get("/rock-types")
def get_rock_types():
    """Get list of supported rock types"""
    return {
        "supported_rock_types": list(ROCK_TYPE_ENCODING.keys()),
        "encoding_map": ROCK_TYPE_ENCODING
    }

@app.post("/predict", summary="Predict rockfall risk for a mining block")
def predict_rockfall(input_data: RockfallInput):
    try:
        # Encode rock type to integer
        rock_type_encoded = encode_rock_type(input_data.Rock_Type)
        
        # Convert Pydantic model to dict with keys matching your logic.py input
        data_dict = {
            "X": input_data.X,
            "Y": input_data.Y,
            "Z": input_data.Z,
            "Rock_Type_enc": rock_type_encoded,  # Use encoded version
            "Ore_Grade (%)": input_data.Ore_Grade_percent,
            "Tonnage": input_data.Tonnage,
            "Ore_Value (¥/tonne)": input_data.Ore_Value_per_tonne,
            "Mining_Cost (¥)": input_data.Mining_Cost,
            "Processing_Cost (¥)": input_data.Processing_Cost,
        }
        
        # Call your Groq.ai integrated logic inference function
        result = logic.predict_rockfall_with_groq(data_dict)
        
        return {
            "success": True,
            "prediction": {
                "risk_label": result["risk_label"],
                "confidence": result["confidence"],
                "grid_position": result.get("grid_position", {}),
            },
            "explanation": result.get("explanation", ""),
            "key_factors": result.get("key_factors", []),
            "safety_recommendations": result.get("safety_recommendations", []),
            "input_summary": result.get("input_summary", {}),
            "metadata": {
                "rock_type_original": input_data.Rock_Type,
                "rock_type_encoded": rock_type_encoded,
                "model_version": "1.0"
            }
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Input validation error: {str(ve)}")
    except FileNotFoundError as fe:
        raise HTTPException(status_code=500, detail=f"Model file not found: {str(fe)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-simple", summary="Simple prediction endpoint (basic output)")
def predict_rockfall_simple(input_data: RockfallInput):
    """Simplified endpoint that returns only risk label and confidence"""
    try:
        rock_type_encoded = encode_rock_type(input_data.Rock_Type)
        
        data_dict = {
            "X": input_data.X,
            "Y": input_data.Y,
            "Z": input_data.Z,
            "Rock_Type_enc": rock_type_encoded,
            "Ore_Grade (%)": input_data.Ore_Grade_percent,
            "Tonnage": input_data.Tonnage,
            "Ore_Value (¥/tonne)": input_data.Ore_Value_per_tonne,
            "Mining_Cost (¥)": input_data.Mining_Cost,
            "Processing_Cost (¥)": input_data.Processing_Cost,
        }
        
        result = logic.predict_rockfall_with_groq(data_dict)
        
        return {
            "risk_label": result["risk_label"],
            "confidence": result["confidence"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

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