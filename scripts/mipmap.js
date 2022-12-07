import PATH from 'path';
import Compile from "./shared/compile.js";

await Mipmap();
console.log("MIPMAPPING DONE!")

async function Mipmap() {
   const path = "public\\archive";

   const profile = { properties: { isDir: false } };
   const options = { ignore: ["\\_meta\\"] };
   const sizes = [
      { width: 512, height: 512 },
      { width: 256, height: 256 },
      { width: 128, height: 128 },
      { width: 64, height: 64 },
      { width: 32, height: 32 },
      { width: 16, height: 16 },
      { width: 8, height: 8 },
      { width: 4, height: 4 },
      { width: 2, height: 2 },
   ]
   const override = false;
   const ask = { compile: false, run: true };
   const log = { each: false, summary: true };

   const actions = [
      {
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename}.jpg`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vframes", "1",
               target_path
            ]
         }
      },

      ...sizes.map(({ width, height }) => ({
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename} ${width}x${height}.gif`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-t", "60",
               "-i", item.path,
               "-vf", `fps=50,scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
               target_path
            ]
         }
      })),

      ...sizes.map(({ width, height }) => ({
         profile: { properties: { extension: ".jpg" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename} ${width}x${height}.jpg`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      })),

      ...sizes.map(({ width, height }) => ({
         profile: { properties: { extension: ".webp" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename} ${width}x${height}.webp`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      })),
   ]

   await Compile(actions, path, profile, options, ask, log);
}