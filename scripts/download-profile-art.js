import fs from "node:fs/promises";
import path from "node:path";

const assets = [
  ["trapped-souls.png", "564b1f2e6a765a912a05f56a0d622503dc7acf56980671e084a9da94c87ce646"],
  ["macabre-frame.png", "84168a5adc7db3805121683b85f398b21ebfd9e0396bc9a2bbf70591acb482fb"],
];

const outputDir = path.resolve("public/profile-art");
await fs.mkdir(outputDir, { recursive: true });

for (const [filename, hash] of assets) {
  const response = await fetch(`https://cdn.discordapp.com/media/v1/collectibles-shop/${hash}`);
  if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const png = bytes.length > 32 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const animated = bytes.includes(Buffer.from("acTL"));
  if (response.headers.get("content-type") !== "image/png" || !png || !animated)
    throw new Error(`${filename}: o arquivo não é um APNG animado válido.`);
  await fs.writeFile(path.join(outputDir, filename), bytes);
  console.log(`${filename}: APNG confirmado (${bytes.length} bytes)`);
}

