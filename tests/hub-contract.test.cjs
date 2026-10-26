const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),ts=require('typescript');
const cache=new Map();
function load(name){const file=path.resolve(__dirname,'../lib',name+'.ts');if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,Buffer,Date,URL,TextDecoder,process:{env:{}},require:n=>n.startsWith('.')?load(path.basename(n)):require(n)});return module.exports;}
const c=load('hub-contract'),features=load('hub-features'),key='management-fixture-'.repeat(4),readKey='readonly-fixture-'.repeat(4),url='https://onlycars.fixture.invalid/api/integrations/nanolabs/management?resource=catalog',actor='fixture-owner',now=Date.parse('2026-10-25T12:00:00Z');
const env={HUB_MANAGEMENT_ENABLED:'true',HUB_MANAGEMENT_TOKEN:key,HUB_INTEGRATION_ENABLED:'true',HUB_INTEGRATION_TOKEN:readKey};
function signed({body='',method='GET',timestamp=now,actorName=actor,uri=url}={}){const headers={Authorization:'Bearer '+key,'X-NanoLabs-Timestamp':String(timestamp),'X-NanoLabs-Actor':actorName};const u=new URL(uri);headers['X-NanoLabs-Signature']=crypto.createHmac('sha256',key).update([timestamp,method,u.pathname+u.search,actorName,body].join('\n')).digest('hex');return new Request(uri,{method,headers,...(body?{body}:{} )});}
test('separate opt-in credentials and constant-size token checks; cookies have no authority',()=>{
 const r=signed();assert.equal(c.authenticateBearer(r,'management',env),key);assert.throws(()=>c.authenticateBearer(r,'read',env),e=>e.status===401);assert.throws(()=>c.authenticateBearer(new Request(url,{headers:{Cookie:'onlycars_user_session=fixture'}}),'management',env),e=>e.status===401);for(const e of [{...env,HUB_MANAGEMENT_ENABLED:'false'},{...env,HUB_MANAGEMENT_TOKEN:'short'},{...env,HUB_MANAGEMENT_TOKEN:readKey}])assert.throws(()=>c.authenticateBearer(r,'management',e),e=>e.status===503);
});
test('HMAC binds actor, path, method and bytes, rejecting old and future timestamps',()=>{
 assert.equal(c.authenticateSignature(signed(),'',key,now),actor);for(const timestamp of [now-60001,now+60001])assert.throws(()=>c.authenticateSignature(signed({timestamp}),'',key,now),e=>e.status===401);assert.throws(()=>c.authenticateSignature(signed(),'changed',key,now),e=>e.status===401);const r=signed();r.headers.set('X-NanoLabs-Actor','other');assert.throws(()=>c.authenticateSignature(r,'',key,now));const p=signed({method:'POST',body:'{}'});assert.equal(c.authenticateSignature(p,'{}',key,now),actor);assert.throws(()=>c.authenticateSignature(p,'{ }',key,now));
});
test('body bounds apply to declared and actual bytes',async()=>{
 await assert.rejects(c.limitedBody(new Request(url,{method:'POST',headers:{'Content-Length':'40000'},body:'{}'})),e=>e.status===413);await assert.rejects(c.limitedBody(new Request(url,{method:'POST',body:'x'.repeat(32769)})),e=>e.status===413);assert.equal(await c.limitedBody(new Request(url,{method:'POST',body:'{}'})),'{}');
});
test('idempotency digests are keyed, deterministic, actor-bound and order independent',()=>{
 const a={requestId:crypto.randomUUID(),actor,operation:'admin.update',input:{name:'Fixture',password:'not-a-real-password'}};
 assert.equal(c.requestDigest(a,key),c.requestDigest({...a,input:{password:'not-a-real-password',name:'Fixture'}},key));assert.notEqual(c.requestDigest(a,key),c.requestDigest(a,readKey));assert.notEqual(c.requestDigest(a,key),c.requestDigest({...a,actor:'other'},key));assert.notEqual(c.fingerprint(new Date(now)),c.fingerprint(new Date(now+1)));
});
test('commands are strict and catalog exposes only executed module gates and USD plan amounts',()=>{
 const plan={name:'Fixture',description:'',priceCents:100,currency:'USD',active:true,modules:{pwa_clientes:true,seller_pwa:false,branding_documentos:true},limits:{maxVehicles:10,maxUsers:5,maxLocations:1},code:'QA-PLAN'};assert.equal(c.commandSchemas['plan.create'].parse(plan).currency,'USD');assert.throws(()=>c.commandSchemas['plan.create'].parse({...plan,currency:'ARS'}));assert.throws(()=>c.commandSchemas['plan.create'].parse({...plan,limits:{...plan.limits,maxUsers:0}}));assert.throws(()=>c.commandSchemas['plan.create'].parse({...plan,modules:{...plan.modules,unexecuted:true}}));assert.throws(()=>c.commandSchemas['plan.create'].parse({...plan,priceCents:1.01}));assert.equal(c.CATALOG.destructiveDelete,false);assert.equal(c.CATALOG.immutableSlug,true);assert(c.CATALOG.operations.includes('domain.add'));assert(!c.CATALOG.operations.includes('payment.status'));
});
test('activation and trial require an effective, ordered period',()=>{
 const start='2026-10-24T00:00:00Z',end='2026-11-24T00:00:00Z';assert(c.period(start,end,'ACTIVE',null,new Date(now)));assert.throws(()=>c.period(end,start));assert.throws(()=>c.period(start,end,'TRIAL',null,new Date(now)));assert.throws(()=>c.period(start,end,'TRIAL','2026-12-01T00:00:00Z',new Date(now)));assert.throws(()=>c.period(start,'2026-10-25T11:00:00Z','ACTIVE',null,new Date(now)));
});
test('inheritance retains plan behavior; explicit overrides win without erasing config',()=>{
 const set=features.effectiveFeatureSet(['seller_pwa','historical'],[{featureKey:'seller_pwa',isEnabled:false,hubInherit:true},{featureKey:'pwa_clientes',isEnabled:true},{featureKey:'historical',isEnabled:false}]);assert.equal(set.has('seller_pwa'),true);assert.equal(set.has('pwa_clientes'),true);assert.equal(set.has('historical'),false);assert.throws(()=>features.assertFeatureConfigurationAllowed({hubManaged:true},false,false));assert.doesNotThrow(()=>features.assertFeatureConfigurationAllowed(null,false,false));assert.throws(()=>features.assertFeatureConfigurationAllowed(null,true,false));
});
test('runtime module guards preserve unmanaged legacy behavior and enforce platform decisions',()=>{
 const t={features:new Set(),managedModules:{seller_pwa:true}};assert.throws(()=>features.assertManagedModuleEnabled(t,'seller_pwa'));assert.equal(features.managedModuleEnabled(t,'branding_documentos'),true);t.features.add('seller_pwa');assert.doesNotThrow(()=>features.assertManagedModuleEnabled(t,'seller_pwa'));
});
test('legacy plan defaults retain actual seller and branding access until explicitly managed',()=>{
 assert.deepEqual([...features.effectivePlanFeatures(['historical'],false)].sort(),['branding_documentos','historical','seller_pwa']);assert.deepEqual([...features.effectivePlanFeatures(['historical'],true)],['historical']);
});
