import type { Store } from '../database/store'
export class GitHubError extends Error { constructor(message:string,public status:number,public reset:string|null=null){super(message)} }
export class GitHubClient {
 private tail:Promise<unknown>=Promise.resolve();remaining:number|null=null
 constructor(private store:Store,private token:()=>string|undefined,private fetcher:typeof fetch=fetch){}
 request<T>(path:string,signal?:AbortSignal):Promise<{data:T;link:string}>{const run=()=>this.execute<T>(path,signal);const next=this.tail.then(run,run);this.tail=next.catch(()=>{});return next}
 private async execute<T>(path:string,signal?:AbortSignal):Promise<{data:T;link:string}>{
 const url=new URL(path,'https://api.github.com');if(url.origin!=='https://api.github.com'||!url.pathname.startsWith('/repos/'))throw new Error('Unapproved GitHub API destination')
 const cached=this.store.db.prepare('SELECT * FROM http_cache WHERE url=?').get(url.href) as {etag:string;body:string;link:string}|undefined
 for(let attempt=0;attempt<3;attempt++){
 signal?.throwIfAborted();const token=this.token();let response:Response
 try{response=await this.fetcher(url,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'OSS-Compass',...(token?{Authorization:`Bearer ${token}`} :{}),...(cached?{'If-None-Match':cached.etag}:{})},signal:AbortSignal.any([AbortSignal.timeout(20000),...(signal?[signal]:[])]),redirect:'error'})}catch(error){if(signal?.aborted||attempt===2)throw error;await this.delay(250*2**attempt,signal);continue}
 const remaining=response.headers.get('x-ratelimit-remaining');if(remaining!==null)this.remaining=Number(remaining)
 if(response.status===304&&cached)return {data:JSON.parse(cached.body),link:cached.link}
 if(response.status===429||(response.status===403&&(remaining==='0'||response.headers.has('retry-after'))))throw new GitHubError('GitHub rate limit reached. Cached data remains available; retry after the reset time.',response.status,response.headers.get('x-ratelimit-reset')||response.headers.get('retry-after'))
 if(response.status>=500&&attempt<2){await this.delay(250*2**attempt,signal);continue}
 if(!response.ok)throw new GitHubError(`GitHub returned ${response.status}. ${response.status===401?'Check or remove your token.':response.status===404?'Repository or resource was not found.':'Retry later; cached records are retained.'}`,response.status)
 const data=await response.json() as T,etag=response.headers.get('etag'),link=response.headers.get('link')??''
 if(etag)this.store.db.prepare('INSERT INTO http_cache VALUES(?,?,?,?) ON CONFLICT(url) DO UPDATE SET etag=excluded.etag,body=excluded.body,link=excluded.link').run(url.href,etag,JSON.stringify(data),link)
 return {data,link}
 }
 throw new Error('GitHub request failed')
 }
 private delay(ms:number,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(new Error('Sync cancelled'))};const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve()},ms);signal?.addEventListener('abort',abort,{once:true})})}
 async pages<T>(path:string,limit:number,signal?:AbortSignal){let next=path;const data:T[]=[];let partial=false;while(next){const result=await this.request<T[]>(next,signal);if(!Array.isArray(result.data))throw new Error('Unexpected GitHub list response');const remaining=limit-data.length;data.push(...result.data.slice(0,remaining));const link=result.link.match(/<([^>]+)>;\s*rel="next"/)?.[1]??'';if(data.length>=limit){partial=!!link||result.data.length>remaining;break}next=link}return {data,partial}}
}
