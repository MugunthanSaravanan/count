import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [animalCounts, setAnimalCounts] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    };

    startCamera();

    const captureFrame = async () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg');

        // Convert dataURL to Blob
        const blob = await fetch(dataURL).then(res => res.blob());

        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');

        try {
          console.log('Sending image data to server...');
          const res = await axios.post('http://127.0.0.1:5001/detect', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Server response:', res.data);
          setAnimalCounts(res.data);
        } catch (error) {
          console.error('Error fetching animal counts:', error);
        }
      }
    };

    const interval = setInterval(() => {
      captureFrame();
    }, 5000); // Capture and send every 5 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  return (
    <div className="container">
      <div className="camera-preview">
        <video ref={videoRef} autoPlay style={{ width: '100%', height: 'auto' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <div className="animal-counts">
        <h2>Animal Counts:</h2>
        <table>
          <thead>
            <tr>
              <th>Animal</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(animalCounts).length === 0 ? (
              <tr>
                <td colSpan="2">No data available</td>
              </tr>
            ) : (
              Object.entries(animalCounts).map(([animal, count]) => (
                <tr key={animal}>
                  <td>{animal}</td>
                  <td>{count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
