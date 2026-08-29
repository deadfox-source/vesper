import os
import glob
from PIL import Image
import numpy as np

# Find the most recently modified jpg in the brain directory
brain_dir = r"C:\Users\sanze\.gemini\antigravity\brain\4ccda0d0-5b3a-4e3d-87ba-e98362e38e9e"
jpgs = glob.glob(os.path.join(brain_dir, "*.jpg"))
jpgs.sort(key=os.path.getmtime, reverse=True)
latest_jpg = jpgs[0]
print(f"Processing {latest_jpg}")

img = Image.open(latest_jpg).convert("RGBA")
data = np.array(img)

# The image has black drawing, white interior, and a greenish grid background
# Let's use a simple heuristic to extract the character.
# Black is R,G,B < 100
# White is R,G,B > 220
# Background is everything else.

r = data[:,:,0]
g = data[:,:,1]
b = data[:,:,2]
a = data[:,:,3]

is_black = (r < 100) & (g < 100) & (b < 100)
is_white = (r > 200) & (g > 200) & (b > 200)

character = is_black | is_white
background = ~character

a[background] = 0

# To handle anti-aliasing near the black lines, we can make pixels with low luminance mostly opaque black
# and high luminance mostly opaque white, but actually a hard threshold might be okay for a glitchy pixel effect.

img_out = Image.fromarray(data)
out_path = r"C:\Users\sanze\Documents\Antigravity Project\Vesper Project\VesperWeb\public\vesper_sprite_transparent.png"
img_out.save(out_path)
print(f"Saved transparent sprite to {out_path}")
