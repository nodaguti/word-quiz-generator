import { spawn } from 'child_process';
import path from 'path';

const command = path.join(__dirname, '..', '..', 'vendor', 'install.sh');

export default function (args) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args);
    cmd.stdout.pipe(process.stdout);
    cmd.stderr.pipe(process.stderr);
    cmd.on('exit', (code) => {
      if (code !== 0) {
        reject();
      } else {
        resolve();
      }
    });
  });
}
