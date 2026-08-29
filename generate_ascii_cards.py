import os
import sys
import re
import argparse
from PIL import Image, ImageDraw

# Mapping of pixel brightness to ASCII characters.
# Ordered from darkest (space) to brightest (@) for high-contrast on absolute black background.
ASCII_CHARS = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"]

def scale_image(image, new_width=30, new_height=10):
    """Resizes the image to the exact dimensions of the card graphic."""
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

def pixels_to_ascii(image):
    """Maps pixels to ASCII characters based on luminance."""
    pixels = image.getdata()
    ascii_str = ""
    for pixel in pixels:
        # Scale 0-255 to 0-len(ASCII_CHARS)-1
        val = int((pixel / 255) * (len(ASCII_CHARS) - 1))
        ascii_str += ASCII_CHARS[val]
    return ascii_str

def image_to_ascii_graphic(image, width=30, height=10):
    """Converts PIL image to formatted ASCII graphic rows."""
    grayscale_img = image.convert("L")
    resized_img = scale_image(grayscale_img, width, height)
    ascii_data = pixels_to_ascii(resized_img)
    
    # Format into card graphic rows: "|<30 chars>|"
    rows = []
    for i in range(0, len(ascii_data), width):
        row = ascii_data[i:i+width]
        rows.append(f"|{row}|")
    return rows

# ==========================================
# Procedural Draw Functions for Major Arcana
# ==========================================

def draw_the_fool():
    # Ascii Lighthouse
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 85, 150, 100], fill=40)  # Sea
    draw.polygon([50, 85, 100, 85, 90, 75, 60, 75], fill=100)  # Base
    draw.polygon([65, 75, 85, 75, 80, 30, 70, 30], fill=180)  # Tower
    draw.rectangle([71, 20, 79, 30], fill=255)  # Light room
    draw.polygon([68, 20, 82, 20, 75, 10], fill=120)  # Roof
    draw.polygon([75, 25, 0, 10, 0, 45], fill=255)  # Left ray
    draw.polygon([75, 25, 150, 10, 150, 45], fill=255)  # Right ray
    return img

def draw_the_magician():
    # Ascii Hacker / Wand & Orb
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    draw.ellipse([55, 30, 95, 70], outline=255, width=4)  # Core Orb
    draw.ellipse([65, 40, 85, 60], fill=255)  # Inner Orb
    draw.line([10, 10, 55, 40], fill=180, width=3)  # Left ray
    draw.line([140, 10, 95, 40], fill=180, width=3)  # Right ray
    draw.line([75, 70, 75, 95], fill=255, width=4)  # Wand shaft
    return img

def draw_the_high_priestess():
    # Ascii Vault / Crescent Moon & Pillars
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 10, 35, 90], fill=150)  # Left Pillar B
    draw.rectangle([115, 10, 130, 90], fill=150)  # Right Pillar J
    draw.ellipse([50, 25, 100, 75], fill=255)  # Full Moon
    draw.ellipse([65, 25, 115, 75], fill=0)  # Mask to make Crescent
    return img

def draw_the_empress():
    # Spanning Tree / Nature Node
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Draw a branching tree
    draw.line([75, 90, 75, 60], fill=255, width=6)  # Trunk
    draw.line([75, 60, 40, 35], fill=200, width=4)  # Branch L1
    draw.line([75, 60, 110, 35], fill=200, width=4)  # Branch R1
    draw.ellipse([25, 20, 55, 50], fill=255)  # Leaf L
    draw.ellipse([95, 20, 125, 50], fill=255)  # Leaf R
    draw.ellipse([60, 10, 90, 40], fill=255)  # Leaf C
    return img

def draw_the_emperor():
    # Ascii Fortress / The Kernel
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # A heavy crown or fortress silhouette
    draw.rectangle([30, 50, 120, 90], fill=180)  # Wall base
    draw.rectangle([40, 30, 60, 50], fill=180)  # Left Battlement
    draw.rectangle([90, 30, 110, 50], fill=180)  # Right Battlement
    draw.rectangle([65, 20, 85, 50], fill=255)  # Center Keep
    draw.ellipse([70, 60, 80, 80], fill=0)  # Gate
    return img

def draw_the_hierophant():
    # Ascii Cathedral / Keys & Gateway
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # A large key or double cross
    draw.line([75, 15, 75, 85], fill=255, width=6)  # Main shaft
    draw.line([50, 35, 100, 35], fill=255, width=6)  # Cross bar 1
    draw.line([55, 55, 95, 55], fill=255, width=6)  # Cross bar 2
    draw.ellipse([60, 75, 90, 95], outline=255, width=4)  # Key ring
    return img

def draw_the_lovers():
    # Duality / Overlapping Venn Circles
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Two overlapping circles
    draw.ellipse([35, 25, 95, 85], outline=255, width=3)  # Circle L
    draw.ellipse([55, 25, 115, 85], outline=255, width=3)  # Circle R
    # Draw a small heart/core in the overlapping center
    draw.polygon([75, 45, 65, 35, 75, 25, 85, 35], fill=255)
    return img

def draw_the_chariot():
    # Ascii Dreadnought / Payload
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    draw.rectangle([35, 35, 115, 75], fill=200)  # Hull
    draw.ellipse([25, 60, 50, 85], fill=255)  # Wheel L
    draw.ellipse([100, 60, 125, 85], fill=255)  # Wheel R
    draw.polygon([50, 35, 100, 35, 85, 15, 65, 15], fill=255)  # Cabin
    return img

def draw_strength():
    # Infinity Symbol / Core Overclock
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Draw an infinity symbol (figure 8)
    draw.ellipse([25, 30, 75, 70], outline=255, width=5)
    draw.ellipse([75, 30, 125, 70], outline=255, width=5)
    draw.ellipse([68, 43, 82, 57], fill=255)  # Center core node
    return img

def draw_the_hermit():
    # Ascii Lantern / Signal Isolation
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Draw a hanging lantern
    draw.line([75, 10, 75, 25], fill=150, width=3)  # Hanger
    draw.polygon([50, 25, 100, 25, 85, 35, 65, 35], fill=200)  # Top cap
    draw.rectangle([55, 35, 95, 75], outline=200, width=4)  # Glass container
    draw.ellipse([65, 45, 85, 65], fill=255)  # Flame / Light source
    draw.polygon([50, 75, 100, 75, 95, 85, 55, 85], fill=200)  # Base
    return img

def draw_wheel_of_fortune():
    # Ascii Rotor / Algorithm
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # A detailed wheel
    draw.ellipse([35, 10, 115, 90], outline=255, width=5)  # Outer rim
    draw.ellipse([60, 35, 90, 65], fill=255)  # Center hub
    # Spokes
    draw.line([75, 10, 75, 90], fill=255, width=3)
    draw.line([35, 50, 115, 50], fill=255, width=3)
    draw.line([47, 22, 103, 78], fill=255, width=3)
    draw.line([47, 78, 103, 22], fill=255, width=3)
    return img

def draw_justice():
    # Load Balancer / Balance Scales
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    draw.line([75, 10, 75, 85], fill=255, width=4)  # Vertical pillar
    draw.line([25, 25, 125, 25], fill=255, width=4)  # Horizontal beam
    # Left scale pan
    draw.line([25, 25, 15, 60], fill=180, width=2)
    draw.line([25, 25, 35, 60], fill=180, width=2)
    draw.arc([15, 55, 35, 70], start=0, end=180, fill=255, width=3)
    # Right scale pan
    draw.line([125, 25, 115, 60], fill=180, width=2)
    draw.line([125, 25, 135, 60], fill=180, width=2)
    draw.arc([115, 55, 135, 70], start=0, end=180, fill=255, width=3)
    # Base
    draw.rectangle([45, 85, 105, 95], fill=255)
    return img

def draw_the_hanged_man():
    # Deadlock / Suspended Thread
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    draw.line([10, 15, 110, 15], fill=150, width=4)  # Top gallows
    draw.line([100, 15, 100, 85], fill=150, width=4)  # Side post
    draw.line([45, 15, 45, 40], fill=255, width=2)  # Rope
    # Inverted figure (simplified: stick figure upside down)
    draw.ellipse([38, 65, 52, 79], fill=200)  # Head (at bottom)
    draw.line([45, 40, 45, 65], fill=255, width=4)  # Torso
    draw.line([45, 45, 30, 30], fill=255, width=3)  # Leg 1 (bent)
    draw.line([45, 45, 60, 40], fill=255, width=3)  # Leg 2 (tied)
    draw.line([45, 55, 30, 60], fill=180, width=2)  # Arm 1
    draw.line([45, 55, 60, 60], fill=180, width=2)  # Arm 2
    return img

def draw_death():
    # The Void / Scythe
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Stylized scythe & skull silhouette
    draw.line([40, 90, 120, 20], fill=255, width=4)  # Handle
    draw.polygon([120, 20, 60, 10, 55, 15, 115, 25], fill=255)  # Blade
    # Skull outline
    draw.ellipse([25, 45, 55, 75], fill=200)
    draw.rectangle([33, 68, 47, 80], fill=200)  # Jaw
    draw.ellipse([30, 52, 38, 62], fill=0)  # Eye L
    draw.ellipse([42, 52, 50, 62], fill=0)  # Eye R
    draw.polygon([36, 64, 40, 60, 44, 64], fill=0)  # Nose cavity
    return img

def draw_temperance():
    # Alchemy / Dual Streams
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Two cups pouring water into each other
    draw.polygon([20, 20, 45, 20, 38, 40, 27, 40], fill=200)  # Cup Top Left
    draw.polygon([130, 80, 105, 80, 112, 60, 123, 60], fill=200)  # Cup Bottom Right
    # Stream
    draw.line([32, 40, 118, 60], fill=255, width=4)
    # Triangle symbol in background
    draw.polygon([60, 70, 90, 70, 75, 44], outline=150, width=2)
    return img

def draw_the_devil():
    # Black Ice / Pentagram & Horns
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Star pentagram
    points = [(75, 10), (95, 75), (30, 35), (120, 35), (55, 75)]
    draw.polygon(points, outline=255, width=3)
    # Horns overlapping
    draw.arc([40, 15, 75, 45], start=180, end=360, fill=255, width=4)
    draw.arc([75, 15, 110, 45], start=180, end=360, fill=255, width=4)
    return img

def draw_the_tower():
    # Segfault / Lightning & Tower
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # A tower splitting
    draw.polygon([50, 95, 65, 40, 85, 40, 100, 95], fill=180)  # Tower base
    draw.polygon([60, 40, 75, 20, 90, 40], fill=180)  # Crown top
    # Lightning bolt striking from top-left (10, 5) to (75, 30)
    draw.line([10, 5, 50, 35], fill=255, width=4)
    draw.line([50, 35, 40, 40], fill=255, width=4)
    draw.line([40, 40, 75, 55], fill=255, width=5)
    # Explosion rays
    draw.line([75, 35, 110, 30], fill=255, width=2)
    draw.line([75, 35, 40, 25], fill=255, width=2)
    return img

def draw_the_star():
    # Uplink / Star
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # An 8-pointed star in the center
    cx, cy = 75, 50
    draw.line([cx, cy-40, cx, cy+40], fill=255, width=4)  # Vert
    draw.line([cx-40, cy, cx+40, cy], fill=255, width=4)  # Horiz
    draw.line([cx-25, cy-25, cx+25, cy+25], fill=255, width=3)  # Diag 1
    draw.line([cx-25, cy+25, cx+25, cy-25], fill=255, width=3)  # Diag 2
    draw.ellipse([cx-8, cy-8, cx+8, cy+8], fill=255)  # Core
    return img

def draw_the_moon():
    # Ghost MAC / Crescent & Waves
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Moon outline
    draw.ellipse([50, 15, 100, 65], fill=255)
    draw.ellipse([62, 15, 112, 65], fill=0)  # Masking
    # Two tower silhouettes at the bottom
    draw.rectangle([25, 60, 40, 90], fill=150)
    draw.rectangle([110, 60, 125, 90], fill=150)
    # Waves
    draw.line([0, 90, 150, 90], fill=200, width=2)
    draw.line([0, 95, 150, 95], fill=200, width=2)
    return img

def draw_the_sun():
    # Radiance / Solar Core
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    cx, cy = 75, 50
    # Core sun sphere
    draw.ellipse([cx-20, cy-20, cx+20, cy+20], fill=255)
    # Rays shooting outwards
    for i in range(12):
        import math
        angle = i * (2 * math.pi / 12)
        x1 = cx + 25 * math.cos(angle)
        y1 = cy + 25 * math.sin(angle)
        x2 = cx + 45 * math.cos(angle)
        y2 = cy + 45 * math.sin(angle)
        draw.line([x1, y1, x2, y2], fill=255, width=3)
    return img

def draw_judgement():
    # Reboot / Trumpet & Resurrection
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # A horn/trumpet pointing down-right
    draw.polygon([20, 20, 30, 15, 80, 50, 75, 55], fill=200)  # Stem
    draw.polygon([80, 50, 110, 35, 115, 65, 75, 55], fill=255)  # Bell
    # Sound rays
    draw.line([115, 50, 135, 50], fill=255, width=3)
    draw.line([110, 35, 125, 20], fill=255, width=3)
    draw.line([115, 65, 125, 80], fill=255, width=3)
    return img

def draw_the_world():
    # Network / Wreath & Node
    img = Image.new("L", (150, 100), 0)
    draw = ImageDraw.Draw(img)
    # Wreath oval
    draw.ellipse([35, 15, 115, 85], outline=200, width=5)
    # Center node
    draw.ellipse([63, 38, 87, 62], fill=255)
    # Diagonal connection wires
    draw.line([35, 15, 65, 40], fill=150, width=2)
    draw.line([115, 15, 85, 40], fill=150, width=2)
    draw.line([35, 85, 65, 60], fill=150, width=2)
    draw.line([115, 85, 85, 60], fill=150, width=2)
    return img

PRAW_DRAWINGS = {
    "THE FOOL": draw_the_fool,
    "THE MAGICIAN": draw_the_magician,
    "THE HIGH PRIESTESS": draw_the_high_priestess,
    "THE EMPRESS": draw_the_empress,
    "THE EMPEROR": draw_the_emperor,
    "THE HIEROPHANT": draw_the_hierophant,
    "THE LOVERS": draw_the_lovers,
    "THE CHARIOT": draw_the_chariot,
    "STRENGTH": draw_strength,
    "THE HERMIT": draw_the_hermit,
    "WHEEL OF FORTUNE": draw_wheel_of_fortune,
    "JUSTICE": draw_justice,
    "THE HANGED MAN": draw_the_hanged_man,
    "DEATH": draw_death,
    "TEMPERANCE": draw_temperance,
    "THE DEVIL": draw_the_devil,
    "THE TOWER": draw_the_tower,
    "THE STAR": draw_the_star,
    "THE MOON": draw_the_moon,
    "THE SUN": draw_the_sun,
    "JUDGEMENT": draw_judgement,
    "THE WORLD": draw_the_world,
}

def get_card_image(card_name, input_dir):
    """
    Looks for a custom image file in input_dir (matching card name).
    If not found, generates it procedurally using Pillow.
    """
    card_filename = card_name.replace(" ", "_")
    # Search for matching file with various common extensions
    for ext in [".png", ".jpg", ".jpeg"]:
        path = os.path.join(input_dir, f"{card_filename}{ext}")
        if os.path.exists(path):
            print(f"Loading custom image for {card_name} from: {path}")
            return Image.open(path)
            
    # Fallback to procedural generator
    if card_name in PRAW_DRAWINGS:
        print(f"No custom image found for {card_name}. Generating procedurally...")
        return PRAW_DRAWINGS[card_name]()
    else:
        # Generic empty placeholder
        print(f"No drawing defined for {card_name}. Creating a generic placeholder...")
        img = Image.new("L", (150, 100), 0)
        draw = ImageDraw.Draw(img)
        draw.rectangle([10, 10, 140, 90], outline=255, width=3)
        return img

# ==========================================
# File Manipulation Logic
# ==========================================

def update_ascii_art_file(filepath, updated_cards):
    """
    Parses src/constants/asciiArt.ts, extracts card metadata, 
    inserts new graphics, and overwrites the file.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex to find card entries like: "THE FOOL": `...`,
    pattern = re.compile(r'(\s*"([^"]+)":\s*`)([\s\S]*?)(`,)')
    
    def replacer(match):
        prefix = match.group(1)
        card_name = match.group(2)
        card_content = match.group(3)
        suffix = match.group(4)
        
        if card_name not in updated_cards:
            # Leave card unchanged
            return match.group(0)
            
        print(f"Integrating new graphic into card: {card_name}")
        
        # Split card content into lines
        lines = card_content.split("\n")
        if len(lines) < 5:
            # Structurally invalid card
            print(f"Warning: {card_name} structure is too short. Skipping.")
            return match.group(0)
            
        header = lines[:5]
        
        # Locate the telemetry logs start (usually begins with "| * ")
        log_start_idx = -1
        for idx, line in enumerate(lines):
            # Header is in indices 0..4, so search from 5 onwards
            if idx >= 5 and line.strip().startswith("| *"):
                log_start_idx = idx
                break
                
        if log_start_idx == -1:
            # Fallback if no logs found: assume logs start near the bottom
            log_start_idx = len(lines) - 8
            
        footer = lines[log_start_idx:]
        
        # Build the new card body
        new_graphic = updated_cards[card_name]
        new_content = "\n".join(header + new_graphic + footer)
        
        return f"{prefix}{new_content}{suffix}"
        
    updated_content = pattern.sub(replacer, content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(updated_content)
    print(f"Successfully updated file: {filepath}")

# ==========================================
# Main Command Line Interface
# ==========================================

def main():
    parser = argparse.ArgumentParser(description="Upgrade tarot card graphics using procedural generation or custom images, then convert them to high-contrast ASCII art and inject them into React constants.")
    parser.add_argument("--card", type=str, help="Run the pipeline only on a specific Major Arcana card (e.g. 'THE FOOL') to test.")
    parser.add_argument("--input-dir", type=str, default="cards_input", help="Directory where custom card images are searched.")
    parser.add_argument("--file", type=str, default="src/constants/asciiArt.ts", help="Path to the asciiArt.ts constant file.")
    args = parser.parse_args()
    
    # Create input directory if it doesn't exist
    if not os.path.exists(args.input_dir):
        os.makedirs(args.input_dir)
        print(f"Created directory: {args.input_dir}")
        
    target_file = args.file
    if not os.path.exists(target_file):
        print(f"Error: Target file {target_file} not found.")
        sys.exit(1)
        
    # Determine which cards to process
    cards_to_process = list(PRAW_DRAWINGS.keys())
    if args.card:
        selected_card = args.card.upper()
        if selected_card not in PRAW_DRAWINGS:
            print(f"Warning: '{selected_card}' is not a recognized Major Arcana key. Will try default drawer.")
            PRAW_DRAWINGS[selected_card] = lambda: Image.new("L", (150, 100), 0)
        cards_to_process = [selected_card]
        print(f"Selected single-card test phase: processing only '{selected_card}'")
        
    # Generate images and convert to ASCII
    converted_cards = {}
    for card in cards_to_process:
        img = get_card_image(card, args.input_dir)
        ascii_graphic = image_to_ascii_graphic(img)
        converted_cards[card] = ascii_graphic
        
    # Update the TS file
    update_ascii_art_file(target_file, converted_cards)
    print("Pipeline complete.")

if __name__ == "__main__":
    main()
