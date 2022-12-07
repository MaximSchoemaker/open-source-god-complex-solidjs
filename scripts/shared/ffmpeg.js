import { spawn } from "child_process";

var CMD_PATH = 'C:/Program Files (x86)/ffmpeg/bin/ffmpeg.exe';

export default async function ffmpeg(args) {
   return new Promise((resolve, reject) => {
      var proc = spawn(CMD_PATH, args);
      proc.stderr.setEncoding("utf8")

      const log = [];

      proc.stderr.on('data', (line) => {
         log.push(line);
      });

      proc.on('close', (err) => {
         if (!err) resolve(log);
         if (err) reject(log);
      });
   });
}
