import os
import glob
from PIL import Image
import numpy as np

# Load the three new images
image_paths = ["1.png", "2.png", "4.png"]
if len(image_paths) != 3:
    print(f"Expected 3 images, found {len(image_paths)}")

frames = []
for p in image_paths:
    img = Image.open(p).convert("RGBA")
    # Downscale by factor of 4 for manageable sprite sizes while retaining extremely high quality 500p resolution
    w, h = img.size
    img = img.resize((w // 4, h // 4), Image.Resampling.LANCZOS)
    frames.append(img)

# Stitch exactly horizontally
fw, fh = frames[0].size
stitched_img = Image.new("RGBA", (fw * len(frames), fh))
for i, frame in enumerate(frames):
    stitched_img.paste(frame, (i * fw, 0))

data = np.array(stitched_img).astype(float)
L = 0.299*data[:,:,0] + 0.587*data[:,:,1] + 0.114*data[:,:,2]

out_r = np.zeros_like(L)
out_g = np.zeros_like(L)
out_b = np.zeros_like(L)
out_a = np.zeros_like(L)

CYAN = (0, 240, 255)
VOID = (5, 10, 15)

for y in range(L.shape[0]):
    for x in range(L.shape[1]):
        lum = L[y,x]
        
        if lum < 90:
            # Solid glowing line art
            out_r[y,x], out_g[y,x], out_b[y,x] = CYAN
            out_a[y,x] = 255
        elif lum < 130:
            # Anti-alias the line art into the void
            alpha = max(0, 255 - ((lum - 90) / 40.0) * 255)
            out_r[y,x], out_g[y,x], out_b[y,x] = CYAN
            out_a[y,x] = alpha
        elif lum < 185:
            # EXACT transparent background
            out_a[y,x] = 0
        elif lum < 220:
            # Soft anti-aliased edge leading into the void face
            alpha = min(180, ((lum - 185) / 35.0) * 180)
            out_r[y,x], out_g[y,x], out_b[y,x] = VOID
            out_a[y,x] = alpha
        else:
            # Translucent dark inner face
            out_r[y,x], out_g[y,x], out_b[y,x] = VOID
            out_a[y,x] = 180

out_data = np.stack([out_r, out_g, out_b, out_a], axis=2).astype(np.uint8)
final_sprite = Image.fromarray(out_data, "RGBA")
out_path = r"C:\Users\sanze\Documents\Antigravity Project\Vesper Project\VesperWeb\public\vesper_sprite_transparent.png"
final_sprite.save(out_path)
print("Successfully generated high-res 4-sequence sprite to", out_path)
