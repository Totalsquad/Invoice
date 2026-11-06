import {env} from 'cloudflare:workers';
import {database,currentUser,sameOrigin,passwordHash,randomToken,digest,same,sessionCookie,cookieName} from '../../../lib/invoice-auth';
const json=(body:any,status=200,extra:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...extra}});
export async function GET(req:Request){const user=await currentUser(req);const account=await database().prepare('SELECT id FROM invoice_accounts LIMIT 1').first();return json({user,needsSetup:!account});}
export async function POST(req:Request){if(!sameOrigin(req))return json({error:'Invalid request origin'},403);try{
 const body:any=await req.json();const db=database();
 if(body.action==='logout'){const token=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(token)await db.prepare('DELETE FROM invoice_sessions WHERE token_hash=?').bind(await digest(token)).run();return json({ok:true},200,{'Set-Cookie':sessionCookie('',req,0)});}
 const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length>256)return json({error:'Enter a valid email and password.'},400);
 const ip=req.headers.get('cf-connecting-ip')||'local';const bucket=Math.floor(Date.now()/900000);const attemptKey=await digest(ip+':'+bucket);
 await db.prepare('INSERT INTO invoice_auth_attempts(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1').bind(attemptKey,Date.now()+900000).run();
 const attempts=await db.prepare('SELECT count FROM invoice_auth_attempts WHERE id=?').bind(attemptKey).first<{count:number}>();if((attempts?.count||0)>10)return json({error:'Too many attempts. Please try again in 15 minutes.'},429);
 if(body.action==='setup'){
 const setupKey=(env as any).SETUP_KEY;
 if(!setupKey)return json({error:'First configure SETUP_KEY as a Cloudflare Worker secret.'},503);
 if(!same(await digest(String(body.setupKey||'')),await digest(setupKey)))return json({error:'Invalid setup key.'},403);
 if(password.length<12)return json({error:'Use a password with at least 12 characters.'},400);
 const salt=randomToken(),hash=await passwordHash(password,salt);
 const result=await db.prepare('INSERT OR IGNORE INTO invoice_accounts(id,email,password_hash,salt) VALUES(1,?,?,?)').bind(email,hash,salt).run();if(!result.meta.changes)return json({error:'An owner account already exists. Please sign in.'},409);
 }else if(body.action==='login'){
 const account=await db.prepare('SELECT id,password_hash,salt FROM invoice_accounts WHERE email=?').bind(email).first<{id:number,password_hash:string,salt:string}>();
 const hash=await passwordHash(password,account?.salt||'dummy-salt-for-unknown-account');if(!account||!same(hash,account.password_hash))return json({error:'Incorrect email or password.'},401);
 }else return json({error:'Invalid action'},400);
 const token=randomToken();await db.prepare('INSERT INTO invoice_sessions(token_hash,account_id,expires_at) VALUES(?,1,?)').bind(await digest(token),Date.now()+604800000).run();
 await db.batch([db.prepare('DELETE FROM invoice_sessions WHERE expires_at<?').bind(Date.now()),db.prepare('DELETE FROM invoice_auth_attempts WHERE expires_at<?').bind(Date.now())]);
 return json({ok:true},200,{'Set-Cookie':sessionCookie(token,req)});
 }catch{return json({error:'Unable to sign in. Check the database setup and try again.'},500);}}
