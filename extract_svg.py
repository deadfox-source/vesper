import cv2
import numpy as np

def extract_svg_path(image_path, invert=False):
    # Load image in grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return "ERROR: Could not load image"
    
    # Threshold the image
    # Assuming the subject is dark on a lighter background, or we can use adaptive
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV if not invert else cv2.THRESH_BINARY)
    
    # Find contours
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return "ERROR: No contours found"
    
    # Get the largest contour
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Simplify the contour to reduce points suitable for SVG
    epsilon = 0.005 * cv2.arcLength(largest_contour, True)
    approx = cv2.approxPolyDP(largest_contour, epsilon, True)
    
    # Start SVG path
    path = ""
    for i, point in enumerate(approx):
        x, y = point[0]
        if i == 0:
            path += f"M {x} {y} "
        else:
            path += f"L {x} {y} "
    
    path += "Z"
    
    return path, img.shape

# Run for normal.jpg
path, shape = extract_svg_path("public/vesper_states/normal.jpg")
print(f"Image shape: {shape}")
print(f"SVG Path:\n{path}")
