import realFs from 'fs';
import gracefulFs from 'graceful-fs';
gracefulFs.gracefulify(realFs)

import PATH from 'path';
import Compile from "./shared/compile.js";

await Meta();
console.log("METADATING DONE!")

async function Meta() {
   // const path = "public\\archive";
   const path = "public\\dropbox";

   const profile = {
      properties: { isDir: false, extension: ".jpg" },
   };
   const options = {};
   const override = false;
   const ask = { compile: false, run: true };
   const log = { each: false, summary: true };

   const actions = [
      {
         profile: {
            // properties: { extension: ".webp" }
         },
         action: {
            kind: "metadata",
            // get_source_path: (item) => PATH.join(item.directory, "_meta", `${item.filename}.json`),
            get_target_path: (item) => PATH.join(item.directory, `${item.filename}.json`),
            override,
         }
      },
   ]

   await Compile(actions, path, profile, options, ask, log);
}
