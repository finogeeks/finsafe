import {createRequire} from 'node:module';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(join(process.argv[2],'node_modules','@deepseek-ai','dsh','package.json'));
const {resolveDshHome}=await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-home-paths')).href);
process.stdout.write(JSON.stringify({home:resolveDshHome()}));
