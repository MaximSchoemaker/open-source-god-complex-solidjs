import PATH from 'path';
import Compile from "./shared/compile.js";

await Rename();
console.log("RENAMING DONE!")

async function Rename() {
   const path = "public\\archive";

   const profile = {
      properties: { isDir: false },
      // test: (item) => item.path.includes("__BS__"),
      // test: (item) => item.path.includes(".png "),
      test: (item) => item.path.includes("  "),
   };
   const options = {};
   const override = true;
   const ask = { compile: false, run: true };
   const log = { each: false, summary: true };

   const actions = [
      {
         profile: {
            // properties: { extension: ".webp" } 
         },
         action: {
            kind: "rename",
            // get_target_path: (item) => PATH.join(item.directory, item.filename_with_extension.split("__BS__").at(-1)),
            // get_target_path: (item) => item.path.replace(".png ", ""),
            get_target_path: (item) => item.path.replace("  ", " "),
            override: override,
         }
      },
   ]

   await Compile(actions, path, profile, options, ask, log);
}
