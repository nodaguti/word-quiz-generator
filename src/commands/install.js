import { spawn } from 'child_process';
import path from 'path';

const command = path.join(__dirname, '..', '..', 'vendor', 'install.sh');

export default function (args) {
  let silent = false;

  if (args[0] === '--silent') {
    silent = true;
    args.shift();
  }

  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args);

    cmd.stderr.pipe(process.stderr);

    if (!silent) {
      cmd.stdout.pipe(process.stdout);
    }

    cmd.on('exit', (code) => {
      if (code !== 0) {
        reject();
      } else {
        resolve();
      }
    });
  });
}
