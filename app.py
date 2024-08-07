from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import torch
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__, static_folder='static/build')
CORS(app)

model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

ANIMAL_CLASSES = [
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe",
    "lion", "tiger", "monkey", "rabbit", "panda", "person"
]

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Convert image file to a format OpenCV can work with
    img_bytes = file.read()
    image = Image.open(io.BytesIO(img_bytes))
    image_np = np.array(image)
    
    # Process image
    results = model(image_np)
    detected_objects = results.pandas().xyxy[0]
    detected_objects = detected_objects[detected_objects['name'].isin(ANIMAL_CLASSES)]

    class_counts = detected_objects['name'].value_counts()
    counts = class_counts.to_dict()
    return jsonify(counts)

@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
