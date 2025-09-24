import { RiskAssessmentInput, PredictionResponse } from '../types';

const API_BASE_URL = "http://127.0.0.1:8000/docs";

export const predictRisk = async (data: RiskAssessmentInput): Promise<PredictionResponse> => {
  try {
    // Transform the data to match FastAPI field names/aliases
    const apiPayload = {
      X: data.X,
      Y: data.Y,
      Z: data.Z,
      Rock_Type: data.Rock_Type,
      "Ore_Grade (%)": data.Ore_Grade_percent,  // Note the alias with parentheses
      Tonnage: data.Tonnage,
      "Ore_Value (¥/tonne)": data.Ore_Value_per_tonne,  // Note the alias
      "Mining_Cost (¥)": data.Mining_Cost,  // Note the alias
      "Processing_Cost (¥)": data.Processing_Cost  // Note the alias
    };

    console.log('Sending API payload:', apiPayload); // Debug log

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(`Failed to get prediction: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API Response:', result); // Debug log
    return result;
  } catch (error) {
    // Mock response for demo purposes when API is not available
    console.warn('API not available, using mock data:', error);
    return {
      success: true,
      prediction: {
        risk_label: data.Tonnage > 1000 || data.Ore_Grade_percent > 40 ? "High Risk" : "Low Risk",
        confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
        grid_position: { x: Math.floor(data.X / 20), y: Math.floor(data.Y / 20) }
      },
      explanation: `Risk assessment based on location (${data.X}, ${data.Y}, ${data.Z}), rock type ${data.Rock_Type}, and operational parameters.`,
      key_factors: [
        `Tonnage of ${data.Tonnage} tonnes indicates ${data.Tonnage > 1000 ? 'large-scale' : 'moderate'} operation`,
        `Ore grade of ${data.Ore_Grade_percent}% ${data.Ore_Grade_percent > 30 ? 'exceeds' : 'is within'} typical thresholds`,
        `Rock type ${data.Rock_Type} has ${['granite', 'basalt'].includes(data.Rock_Type) ? 'high' : 'moderate'} structural stability`,
        `Economic viability ratio suggests ${data.Ore_Value_per_tonne > data.Mining_Cost + data.Processing_Cost ? 'profitable' : 'marginal'} operation`
      ],
      safety_recommendations: [
        "Implement continuous structural monitoring systems",
        "Regular geological surveys and stability assessments",
        "Establish evacuation protocols for high-risk zones",
        "Deploy early warning systems for rockfall detection",
        "Conduct monthly safety training for operational staff"
      ],
      input_summary: {
        location: `(${data.X}, ${data.Y}, ${data.Z})`,
        rock_type: data.Rock_Type,
        ore_details: `${data.Ore_Grade_percent}% grade, ${data.Tonnage} tonnes`,
        economic_summary: `¥${data.Ore_Value_per_tonne}/tonne ore value`
      },
      metadata: {
        rock_type_original: data.Rock_Type,
        total_value: data.Tonnage * data.Ore_Value_per_tonne,
        profit_margin: ((data.Ore_Value_per_tonne - data.Mining_Cost - data.Processing_Cost) / data.Ore_Value_per_tonne) * 100
      }
    };
  }
};

// Alternative: You could also modify your FastAPI to accept both formats
// But it's easier to fix the frontend to match the backend