#!/usr/bin/env python3
import os
import sys
import cv2
import numpy as np
import json
import argparse
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
from PIL import Image

# Add Detectron2 project to Python path
DETECTRON2_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../detectron2")
sys.path.insert(0, DETECTRON2_DIR)

# Import DensePose modules
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2.projects.densepose import add_densepose_config
from detectron2.projects.densepose.structures import DensePoseDataRelative

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variable for the DensePose predictor
predictor = None

def setup_densepose_predictor():
    """
    Set up the DensePose predictor with pre-trained weights.
    """
    global predictor
    
    # Create config
    cfg = get_cfg()
    add_densepose_config(cfg)
    
    # Set model configuration
    cfg.merge_from_file(f"{DETECTRON2_DIR}/projects/DensePose/configs/densepose_rcnn_R_50_FPN_s1x.yaml")
    cfg.MODEL.WEIGHTS = "https://dl.fbaipublicfiles.com/densepose/densepose_rcnn_R_50_FPN_s1x/165712039/model_final_162be9.pkl"
    cfg.MODEL.DEVICE = "cpu"  # Use CPU by default, use 'cuda' if GPU is available
    
    # Create predictor
    predictor = DefaultPredictor(cfg)
    
    return predictor

def process_image(image_data):
    """
    Process an image with DensePose and return the results.
    
    Args:
        image_data: A numpy array representing the image (BGR format)
        
    Returns:
        JSON-serializable object with DensePose results
    """
    # Run DensePose inference
    outputs = predictor(image_data)
    
    # Extract instances from the outputs
    instances = outputs["instances"].to("cpu")
    
    # Check if DensePose predictions are available
    if not instances.has("pred_densepose"):
        return {"error": "No DensePose predictions available for this image"}
    
    # Get DensePose results
    densepose_results = instances.pred_densepose
    
    # Get bounding boxes and scores
    boxes = instances.pred_boxes.tensor.numpy() if instances.has("pred_boxes") else []
    scores = instances.scores.numpy() if instances.has("scores") else []
    
    # Process DensePose results
    results = []
    for i in range(len(densepose_results)):
        # Extract data for this instance
        densepose_result = densepose_results[i]
        
        # Get body part segmentation (IUV)
        i_data = densepose_result.fine_segm
        u_data = densepose_result.u
        v_data = densepose_result.v
        
        # Convert tensors to numpy arrays for serialization
        i_data_np = i_data.numpy().tolist()
        u_data_np = u_data.numpy().tolist()
        v_data_np = v_data.numpy().tolist()
        
        # Get bounding box coordinates
        box = boxes[i].tolist() if i < len(boxes) else []
        score = float(scores[i]) if i < len(scores) else 0.0
        
        results.append({
            "body_parts": i_data_np,  # Body part segmentation (I)
            "u_coordinates": u_data_np,  # U coordinates
            "v_coordinates": v_data_np,  # V coordinates
            "bbox": box,  # Bounding box [x1, y1, x2, y2]
            "score": score  # Detection confidence score
        })
    
    return {
        "num_instances": len(results),
        "instances": results
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the service."""
    return jsonify({"status": "ok", "message": "DensePose service is running"})

@app.route('/analyze', methods=['POST'])
def analyze_pose():
    """
    Analyze an image with DensePose.
    
    Expects a JSON with a 'image' field containing a base64-encoded image.
    Returns DensePose analysis results.
    """
    # Check if predictor is initialized
    global predictor
    if predictor is None:
        try:
            setup_densepose_predictor()
        except Exception as e:
            return jsonify({"error": f"Failed to initialize DensePose predictor: {str(e)}"}), 500
    
    # Get image data from request
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "Request must include 'image' field with base64-encoded image data"}), 400
        
        # Decode base64 image
        image_data = data['image']
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Convert to OpenCV format
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Failed to decode image"}), 400
        
        # Process image with DensePose
        results = process_image(img)
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

def main():
    """Main function to start the Flask server."""
    parser = argparse.ArgumentParser(description="DensePose Analysis Service")
    parser.add_argument("--port", type=int, default=5000, help="Port to run the server on")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host address to bind to")
    parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    args = parser.parse_args()
    
    # Initialize DensePose predictor
    try:
        setup_densepose_predictor()
        print("DensePose predictor initialized successfully")
    except Exception as e:
        print(f"Error initializing DensePose predictor: {e}")
        sys.exit(1)
    
    # Run Flask app
    app.run(host=args.host, port=args.port, debug=args.debug)

if __name__ == "__main__":
    main() 