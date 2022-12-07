import fs from 'fs';
import PATH from 'path';

import Crawl, { checkProfile } from "./crawl.js";
import Import, { getItems } from "./import.js";
import { ask, formatBytes, exists, ensureDir } from "./utils.js";

import sizeOf from 'image-size';
import { promisify } from 'util'
sizeOf.setConcurrency(123456);
const sizeOfPromise = promisify(sizeOf);


await Copy();
console.log("COPYING DONE!")

async function Copy() {
   const item_settings = [
      {
         path: "C:\\websites\\open-source-god-complex\\public\\compiled",
         profile: { properties: { extension: ".mp4" } },
         options: {
            ignore: [
               "\\_meta\\",
            ]
         },
         // target_dir: "C:\\Users\\Maxim\\Desktop\\visuals auto",
         target_dir: "D:\\",
         override: false
      },
   ]

   for (const settings of item_settings) {
      const { path, profile, options, target_dir, override } = settings;

      const compiled_items = await compileItems(path, profile, options, target_dir, override);
      if (compiled_items) {
         const succeeded_items = compiled_items.filter(item => !item.error);
         const failed_items = compiled_items.filter(item => item.error);
         console.log("failed:", { items: failed_items.length });

         const totalSize = succeeded_items.reduce((tot, i) => tot + i.metadata.size, 0);
         console.log("succeeded:", { items: succeeded_items.length, size: formatBytes(totalSize) });
      }
      console.log("DONE!\n");
   };
}

async function compileItems(path, profile, options, target_dir, override) {
   console.log("compileItems", { path, profile, options, target_dir, override });

   const profileActions = [
      {
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "copy",
            get_target_path: (item) => PATH.join(target_dir, item.filename_with_extension),
            override,
         }
      },
   ];

   if (await ask("compile items? y/n: ") != "y")
      return

   const items = await getItems(path, profile, options);

   if (!items)
      return

   const actionQueue = await getActionQueue(items, profileActions);

   if (!actionQueue.length || await ask("run actions? y/n: ") != "y")
      return;

   return await Import(actionQueue);
}

