import PATH from 'path';
import Compile from "./shared/compile.js";

await Import();
console.log("IMPORTING DONE!")

async function Import() {
   const path = "C:\\Users\\Maxim\\Dropbox\\";
   const target_directory = "public\\dropbox\\"

   const profile = { properties: { isDir: false } };
   const options = {
      ignore: [
         "\\.dropbox.cache\\",
         "\\print\\",
         "\\archive\\",
         "\\archive who dis\\",
      ]
   };
   const override = false;
   const ask = { compile: false, run: true };
   const log = { each: false, summary: true };
   const width = 1080;
   const height = 1080;

   const actions = [
      // {
      //    profile: { properties: { extension: ".mp4" } },
      //    action: {
      //       kind: "ffmpeg",
      //       override,
      //       get_target_path: (item) => PATH.join(item.directory.replace(path, target_directory), `${item.filename_with_extension}.webm`),
      //       get_ffmpeg_args: (item, target_path) => [
      //          '-y',
      //          "-i", item.path,
      //          "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
      //          target_path
      //       ]
      //    }
      // },
      {
         profile: { properties: { extension: ".png" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory.replace(path, target_directory), `${item.filename_with_extension}.webp`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vf", `scale='min(iw,${width})':'min(ih,${height})':force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      },
   ]

   await Compile(actions, path, profile, options, ask, log);
}