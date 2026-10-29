# Transparent tile artwork

Source: `tiles.jpg` (preserved). Output: `tiles-transparent.png`.
Tool: built-in image generation, background extraction with transparent alpha.
The game crops this atlas directly; opaque JPG backgrounds and CSS fade masks are no longer used for board props.

Exact prompt:

Use case: background-extraction. Edit target: existing tiles.jpg game sprite atlas. Remove ONLY all gray and white checkerboard background to genuine transparent alpha. Preserve every building, wheel, coin pile, island, stadium, lighthouse, tower, money stack and badminton court exactly as in source, all original colors, shapes, positions, sizes and rows. Keep original horizontal 16:9 canvas and precise layout unchanged so normalized crop coordinates remain valid. Do not add, move, redesign or omit assets. Transparency between all objects. No new checkerboard, no solid background, no text. Output transparent PNG.
