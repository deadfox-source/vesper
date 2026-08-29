import os
import glob
from PIL import Image
import numpy as np

brain_dir = r"C:\Users\sanze\.gemini\antigravity\brain\4ccda0d0-5b3a-4e3d-87ba-e98362e38e9e"
jpgs = glob.glob(os.path.join(brain_dir, "*.jpg"))
jpgs.sort(key=os.path.getmtime, reverse=True)
img = Image.open(jpgs[0]).convert("RGBA")

# Ensure the image is exactly divisible for perfectly clean 3x3 frames
w, h = img.size
new_w = w - (w % 3)
new_h = h - (h % 3)
img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
data = np.array(img).astype(float)

tile_h = new_h // 3
tile_w = new_w // 3

# Wipe out the thick black separating lines at the borders of each 3x3 grid square.
# We turn the outer 30px of each tile into mid-grey so they get flagged as transparent background.
BORDER = 30
for r in range(3):
    for c in range(3):
        y1 = r * tile_h
        y2 = (r+1) * tile_h
        x1 = c * tile_w
        x2 = (c+1) * tile_w
        
        # Erase grid lines around each frame
        data[y1:y1+BORDER, x1:x2] = [150, 150, 150, 255]
        data[y2-BORDER:y2, x1:x2] = [150, 150, 150, 255]
        data[y1:y2, x1:x1+BORDER] = [150, 150, 150, 255]
        data[y1:y2, x2-BORDER:x2] = [150, 150, 150, 255]

# Convert to grayscale brightness
L = 0.299*data[:,:,0] + 0.587*data[:,:,1] + 0.114*data[:,:,2]

out_r = np.zeros_like(L)
out_g = np.zeros_like(L)
out_b = np.zeros_like(L)
out_a = np.zeros_like(L)

CYAN = (0, 240, 255)
VOID = (5, 10, 15)

# Process pixel by pixel
for y in range(new_h):
    for x in range(new_w):
        lum = L[y,x]
        
        if lum < 80:
            # Solid glowing line art
            out_r[y,x], out_g[y,x], out_b[y,x] = CYAN
            out_a[y,x] = 255
        elif lum < 120:
            # Anti-alias the line art into the void
            alpha = max(0, 255 - ((lum - 80) / 40.0) * 255)
            out_r[y,x], out_g[y,x], out_b[y,x] = CYAN
            out_a[y,x] = alpha
        elif lum < 185:
            # EXACT transparent background
            out_a[y,x] = 0
        elif lum < 220:
            # Soft anti-aliased edge leading into the white face
            alpha = min(180, ((lum - 185) / 35.0) * 180)
            out_r[y,x], out_g[y,x], out_b[y,x] = VOID
            out_a[y,x] = alpha
        else:
            # Translucent dark inner face so it acts like glass over the grid
            out_r[y,x], out_g[y,x], out_b[y,x] = VOID
            out_a[y,x] = 180

out_data = np.stack([out_r, out_g, out_b, out_a], axis=2).astype(np.uint8)
img_out = Image.fromarray(out_data, "RGBA")
out_path = r"C:\Users\sanze\Documents\Antigravity Project\Vesper Project\VesperWeb\public\vesper_sprite_transparent.png"
img_out.save(out_path)
print("Saved elegant holographic sprite to", out_path)
