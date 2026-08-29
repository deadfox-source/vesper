import os
from PIL import Image
import numpy as np

sprite_path = r"C:\Users\sanze\Documents\Antigravity Project\Vesper Project\VesperWeb\public\vesper_sprite_transparent.png"
img = Image.open(sprite_path)
data = np.array(img)

h, w, c = data.shape
tile_h = h // 3
tile_w = w // 3

# We will measure the center of mass of the opaque cyan pixels (alpha > 100)
# and shift each tile so its center of mass aligns exactly with the center of the tile.

new_data = np.zeros_like(data)

centers = []
for r in range(3):
    for c in range(3):
        y1 = r * tile_h
        y2 = (r+1) * tile_h
        x1 = c * tile_w
        x2 = (c+1) * tile_w
        
        tile = data[y1:y2, x1:x2]
        
        # Calculate center of mass based on alpha channel
        alpha = tile[:,:,3]
        if np.sum(alpha) == 0:
            centers.append((tile_h//2, tile_w//2))
            continue
            
        y_indices, x_indices = np.indices(alpha.shape)
        # we weight by alpha
        total_mass = np.sum(alpha)
        cy = np.sum(y_indices * alpha) / total_mass
        cx = np.sum(x_indices * alpha) / total_mass
        centers.append((cy, cx))

# Find the average center to align all frames to
avg_cy = np.mean([c[0] for c in centers])
avg_cx = np.mean([c[1] for c in centers])

# Target center is exactly the middle of the tile
target_cy = tile_h / 2.0
target_cx = tile_w / 2.0

for r in range(3):
    for c in range(3):
        y1 = r * tile_h
        y2 = (r+1) * tile_h
        x1 = c * tile_w
        x2 = (c+1) * tile_w
        
        tile = data[y1:y2, x1:x2]
        cy, cx = centers[r*3 + c]
        
        # Offset needed to move (cy, cx) to (target_cy, target_cx)
        dy = int(round(target_cy - cy))
        dx = int(round(target_cx - cx))
        
        # Shift the tile
        shifted_tile = np.zeros_like(tile)
        
        sy1 = max(0, -dy)
        sy2 = min(tile_h, tile_h - dy)
        sx1 = max(0, -dx)
        sx2 = min(tile_w, tile_w - dx)
        
        ty1 = max(0, dy)
        ty2 = min(tile_h, tile_h + dy)
        tx1 = max(0, dx)
        tx2 = min(tile_w, tile_w + dx)
        
        shifted_tile[ty1:ty2, tx1:tx2] = tile[sy1:sy2, sx1:sx2]
        new_data[y1:y2, x1:x2] = shifted_tile

img_out = Image.fromarray(new_data, "RGBA")
img_out.save(sprite_path)
print("Stabilized sprite centers to eliminate wobble")
