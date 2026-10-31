import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const files = {'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/styles.css':['styles.css','text/css; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8']};
const port = Number(process.env.PORT || 4173);
createServer(async(req,res)=>{
 const path = new URL(req.url,'http://127.0.0.1').pathname;
 if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
 const file=files[path];if(!file){res.writeHead(404);res.end('Not found');return;}
 try {const body=await readFile(fileURLToPath(new URL(file[0],import.meta.url)));res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}catch{res.writeHead(500);res.end('Não foi possível abrir o protótipo.');}
}).listen(port,'127.0.0.1',()=>console.log(`Protótipo local: http://127.0.0.1:${port}`));
