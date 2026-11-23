import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.png':'image/png','.webmanifest':'application/manifest+json; charset=utf-8','.markdown':'text/plain; charset=utf-8'};
const assets={};
async function collect(dir, prefix='') {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const path=join(dir,entry.name);
    const key=prefix+'/'+entry.name;
    if (entry.isDirectory()) await collect(path,key);
    else {
      const extension=key.slice(key.lastIndexOf('.'));
      if (!types[extension]) throw new Error('Unexpected asset '+key);
      assets[key]=[types[extension],(await readFile(path)).toString('base64')];
    }
  }
}
await collect('public');
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
const config=JSON.parse(await readFile('worker/sheet.json','utf8'));
await writeFile('dist/server/index.js','const assets='+JSON.stringify(assets)+';\nconst sheetConfig='+JSON.stringify(config)+';\n'+await readFile('worker/index.mjs','utf8')+'\n'+await readFile('worker/cn1-meeting.mjs','utf8'));
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
