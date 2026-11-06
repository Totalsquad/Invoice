import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

test('owner setup, session authentication, CSRF, login, expiry and throttling',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 for(const name of ['0000_military_king_bedlam.sql','0001_dusty_adam_destine.sql'])sqlite.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 function statement(sql){let args=[];return {bind(...values){args=values;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}
 const DB={prepare:statement,async batch(statements){return Promise.all(statements.map(s=>s.run()))}};
 globalThis.__invoiceTestEnv={DB,SETUP_KEY:'only-for-this-test'};
 const temp=mkdtempSync(join(tmpdir(),'invoice-auth-test-'));
 const compile=(source)=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 const authSource=readFileSync(new URL('../lib/invoice-auth.ts',import.meta.url),'utf8').replace(/import \{\s*env\s*\} from 'cloudflare:workers';/, 'const env=globalThis.__invoiceTestEnv;');
 writeFileSync(join(temp,'auth.mjs'),compile(authSource));
 let routeSource=readFileSync(new URL('../app/api/auth/route.ts',import.meta.url),'utf8').replace(/import \{\s*env\s*\} from 'cloudflare:workers';/,'const env=globalThis.__invoiceTestEnv;').replace("'../../../lib/invoice-auth'","'./auth.mjs'");
 writeFileSync(join(temp,'route.mjs'),compile(routeSource));
 try{
 const route=await import(pathToFileURL(join(temp,'route.mjs')));const auth=await import(pathToFileURL(join(temp,'auth.mjs')));
 const base='https://invoice.example';
 const req=(body,cookie='',origin=base,ip='192.0.2.1')=>new Request(base+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie,'cf-connecting-ip':ip},body:JSON.stringify(body)});
 const setup={action:'setup',email:'owner@example.com',password:'a-long-test-password',setupKey:'only-for-this-test'};
 assert.equal((await route.POST(req(setup,'','https://wrong.example'))).status,403);
 assert.equal((await route.POST(req({...setup,setupKey:'wrong'}))).status,403);
 const created=await route.POST(req(setup));assert.equal(created.status,200);const cookie=created.headers.get('set-cookie').split(';')[0];
 assert.match(created.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.match(created.headers.get('set-cookie'),/Secure/);
 assert.equal((await auth.currentUser(new Request(base,{headers:{Cookie:cookie}}))).email,'owner@example.com');
 assert.equal(await auth.currentUser(new Request(base)),null);
 const stored=sqlite.prepare('SELECT * FROM invoice_accounts').get();assert.notEqual(stored.password_hash,setup.password);assert.equal(stored.password_hash.length,64);
 assert.equal((await route.POST(req(setup))).status,409);
 assert.equal((await route.POST(req({action:'login',email:setup.email,password:'incorrect'}))).status,401);
 assert.equal((await route.POST(req({...setup,action:'login'}))).status,200);
 assert.equal((await route.POST(req({action:'logout'},cookie))).status,200);
 assert.equal(await auth.currentUser(new Request(base,{headers:{Cookie:cookie}})),null);
 const loggedIn=await route.POST(req({...setup,action:'login'}));const secondCookie=loggedIn.headers.get('set-cookie').split(';')[0];sqlite.exec('UPDATE invoice_sessions SET expires_at=0');assert.equal(await auth.currentUser(new Request(base,{headers:{Cookie:secondCookie}})),null);
 for(let i=0;i<10;i++)assert.equal((await route.POST(req({...setup,action:'login',password:'incorrect'},'',base,'192.0.2.2'))).status,401);
 assert.equal((await route.POST(req({...setup,action:'login'},'',base,'192.0.2.2'))).status,429);
 }finally{sqlite.close();rmSync(temp,{recursive:true,force:true});delete globalThis.__invoiceTestEnv;}
});
