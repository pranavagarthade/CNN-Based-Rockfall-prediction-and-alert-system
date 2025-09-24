
import React, { useState } from 'react';

const ImageUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/predict-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.rockfall) {
        setResult(data.alert_sent ? 'Rockfall detected! Alert sent.' : 'Rockfall detected, but alert failed.');
      } else {
        setResult('No rockfall detected.');
      }
    } catch (err) {
      setResult('Error uploading or predicting.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Upload Rockfall Image for Prediction</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? 'Uploading...' : 'Predict Rockfall'}
      </button>
      {result && <div className="mt-4 text-lg font-semibold text-center">{result}</div>}
    </div>
  );
};

export default ImageUpload;
