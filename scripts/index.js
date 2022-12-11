import PATH from 'path';
// import fs from 'fs';

import fs from 'graceful-fs';
// gracefulFs.gracefulify(fs);

import Crawl, { generateItem } from "./shared/crawl.js";
import Import from "./shared/import.js";
import { ask, formatBytes, exists, ensureDir } from "./shared/utils.js";

await Index();
console.log("INDEXING DONE!")

async function Index() {
   // const index_path = "public\\archive";
   const index_path = "public\\dropbox";

   const meta_sizes = [
      { width: 2, height: 2 },
      { width: 4, height: 4 },
      { width: 8, height: 8 },
      { width: 16, height: 16 },
      { width: 32, height: 32 },
      { width: 64, height: 64 },
      { width: 128, height: 128 },
      { width: 256, height: 256 },
      { width: 512, height: 512 },
   ]
   const indexed_items = await runIndex(index_path, meta_sizes);
   console.log("len:", indexed_items.length);

   await saveToJSON("src\\compiled\\media.json", indexed_items);
   console.log("SAVED TO JSON!");
}

async function saveToJSON(path, data) {
   await ensureDir(path);
   const json = JSON.stringify(data);
   await fs.promises.writeFile(path, json, 'utf8');
}

function mipmapExtension(item) {
   const { extension } = item;

   switch (extension) {
      case ".mp4":
         return ".gif"
   }
   return extension;
}

async function runIndex(path, meta_sizes) {
   const items = await Crawl(
      path,
      { properties: { isDir: false } },
      { ignore: ["\\_meta\\"] },
   )

   const weight = (i) => i.extension == ".mp4" ? 1 : 0;
   items.sort((i1, i2) => weight(i2) - weight(i1))

   const srced_items = (await Promise.all(items.map(async item => {
      item.src = item.path.replace("public\\", "\\");
      const metadata_path = PATH.join(item.directory, "_meta", `${item.filename}.json`);
      if (await exists(metadata_path)) {
         try {
            const metadata = JSON.parse(fs.readFileSync(metadata_path));
            item.metadata = { ...item.metadata, ...metadata };
         } catch (err) {
            console.error(metadata_path);
            console.error(err);
         }
      }
      return item;
   })))
   // .filter(item => item.metadata.colors);

   const indexed_items = await Promise.all(srced_items.map(async (item, i) => {
      const mipmaps = (await Promise.all(
         meta_sizes.map(async ({ width, height }) => {
            if (item.metadata.size.width < width || item.metadata.size.heigth < height)
               return null;

            const mipmap_extension = mipmapExtension(item);
            const mipmap_path = PATH.join(item.directory, "_meta", `${item.filename} ${width}x${height}${mipmap_extension}`);
            if (!await exists(mipmap_path))
               return null;
            // return generateItem(mipmap_path);
            const mipmap_path_src = mipmap_path.replace("public\\", "\\");
            return { width, height, src: mipmap_path_src };
         })
      )).filter(i => i != null)
         .concat({ width: 1080, height: 1080, src: item.src })

      item.mipmaps = mipmaps;

      return item;
   }));

   return indexed_items;
}
