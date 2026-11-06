import {env} from 'cloudflare:workers';
const encoder=new TextEncoder();
export const cookieName='invoice_session';
export function database(){if(!env.DB)throw Error('Database binding DB is missing');return env.DB;}
export function hex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function digest(value:string){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
export async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
export function same(a:string,b:string){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
export function randomToken(){return hex(crypto.getRandomValues(new Uint8Array(32)).buffer);}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export async function currentUser(req:Request){const token=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token)return null;return database().prepare('SELECT a.email FROM invoice_sessions s JOIN invoice_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first<{email:string}>();}
export function sessionCookie(token:string,req:Request,maxAge=604800){return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
