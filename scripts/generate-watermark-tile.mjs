import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Image } from "imagescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TILE_WIDTH = 560;
const TILE_HEIGHT = 190;
const FONT_SIZE = 50;
const TEXT_COLOR = 0xffffff38;
const STRIPE_COLOR = 0xffffff10;
const STRIPE_PERIOD = 56;
const out = join(root, "src/assets/watermark-tile.png");

const font = new Uint8Array(
  readFileSync(join(root, "src/assets/fonts/DejaVuSans-Bold.ttf")),
);
const text = await Image.renderText(font, FONT_SIZE, "EMBER LENS", TEXT_COLOR);
const tile = new Image(TILE_WIDTH, TILE_HEIGHT);
tile.fill(0x00000000);

for (let y = 1; y <= TILE_HEIGHT; y++) {
  for (let x = 1; x <= TILE_WIDTH; x++) {
    const band = (x + y * 1.6) % STRIPE_PERIOD;
    if (band < STRIPE_PERIOD / 2) tile.setPixelAt(x, y, STRIPE_COLOR);
  }
}

tile.composite(
  text,
  Math.max(1, Math.round((TILE_WIDTH - text.width) / 2)),
  Math.max(1, Math.round((TILE_HEIGHT - text.height) / 2)),
);

writeFileSync(out, await tile.encode(1));
console.log(`Wrote ${out} (${TILE_WIDTH}x${TILE_HEIGHT})`);
