#!/usr/bin/env python3
import os
import sys
import json
import argparse
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the service."""
    return jsonify({"status": "ok", "message": "DensePose mock service is running"})

@app.route('/analyze', methods=['POST'])
def analyze_pose():
    """
    Mock DensePose analysis endpoint.
    Returns a pre-defined response with mock data.
    """
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "Request must include 'image' field with base64-encoded image data"}), 400
        
        # Return a mock DensePose result
        mock_result = {
            "num_instances": 1,
            "instances": [
                {
                    "body_parts": [
                        # Create a 256x256 array filled with zeros except for some body part IDs
                        np.zeros((256, 256), dtype=int).tolist() 
                    ],
                    "u_coordinates": [
                        # Create a 256x256 array with mock U coordinates
                        np.zeros((256, 256), dtype=float).tolist()
                    ],
                    "v_coordinates": [
                        # Create a 256x256 array with mock V coordinates
                        np.zeros((256, 256), dtype=float).tolist()
                    ],
                    "bbox": [50, 50, 200, 400],  # Mock bounding box [x1, y1, x2, y2]
                    "score": 0.98  # Mock detection confidence
                }
            ]
        }
        
        # Add some body parts to the mock data
        body_parts = mock_result["instances"][0]["body_parts"][0]
        
        # Torso
        for i in range(100, 150):
            for j in range(100, 200):
                body_parts[i][j] = 1
        
        # Left Arm
        for i in range(80, 100):
            for j in range(100, 130):
                body_parts[i][j] = 10
        
        # Right Arm
        for i in range(150, 170):
            for j in range(100, 130):
                body_parts[i][j] = 11
        
        # Add more detailed U, V coordinates
        u_coords = mock_result["instances"][0]["u_coordinates"][0]
        v_coords = mock_result["instances"][0]["v_coordinates"][0]
        
        for i in range(256):
            for j in range(256):
                if body_parts[i][j] > 0:
                    u_coords[i][j] = (i % 100) / 100.0
                    v_coords[i][j] = (j % 100) / 100.0
        
        return jsonify(mock_result)
        
    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

def main():
    """Main function to start the Flask server."""
    parser = argparse.ArgumentParser(description="DensePose Mock Service")
    parser.add_argument("--port", type=int, default=5000, help="Port to run the server on")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host address to bind to")
    parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    args = parser.parse_args()
    
    print(f"Starting DensePose mock service on {args.host}:{args.port}")
    print("This is a MOCK service that returns pre-defined responses.")
    print("It does not perform actual DensePose analysis.")
    
    # Run Flask app
    app.run(host=args.host, port=args.port, debug=args.debug)

if __name__ == "__main__":
    main() 