"use strict";
// Writes are allowed only in an explicitly selected loopback/private QA database.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const database=new URL(process.env.DATABASE_URL||'mysql://invalid/invalid'),base=new URL(process.env.HUB_TEST_API_BASE||'http://invalid');
assert.equal(process.env.HUB_TEST_FIXTURE,'true');
assert(['127.0.0.1','localhost'].includes(database.hostname)||/^onlycars-hub-qa-db-[a-z0-9-]+$/.test(database.hostname));
assert(['/onlycars','/onlycars_hub_fixture'].includes(database.pathname));
assert(['127.0.0.1','localhost'].includes(base.hostname)||/^onlycars-hub-qa-app-[a-z0-9-]+$/.test(base.hostname));
const key=process.env.HUB_MANAGEMENT_TOKEN,readKey=process.env.HUB_INTEGRATION_TOKEN;
assert(key?.startsWith('onlycars-fixture-')&&readKey?.startsWith('onlycars-fixture-')&&key!==readKey);
const {PrismaClient}=require(process.env.HUB_TEST_PRISMA_PATH||'@prisma/client'),db=new PrismaClient();
const actor='fixture-owner',platform=process.env.PLATFORM_HOST||'onlycars.fixture.invalid',nonce=crypto.randomBytes(5).toString('hex'),modules=['pwa_clientes','seller_pwa','branding_documentos'];
let assertions=0;
async function raw(path,{method='GET',body,token=key,signature=true,headers={},status=200}={}){
 const text=body?JSON.stringify(body):'',timestamp=String(Date.now()),h={'Content-Type':'application/json','X-Forwarded-Host':platform,Authorization:'Bearer '+token,...headers};
 if(signature){h['X-NanoLabs-Timestamp']=timestamp;h['X-NanoLabs-Actor']=actor;h['X-NanoLabs-Signature']=crypto.createHmac('sha256',key).update([timestamp,method,path,actor,text].join('\n')).digest('hex');}
 const r=await fetch(new URL(path,base),{method,headers:h,...(text?{body:text}:{}),redirect:'manual',signal:AbortSignal.timeout(30000)});
 const j=await r.json();assert.equal(r.status,status,path+' '+(j.code||''));assertions++;return j;
}
const endpoint='/api/integrations/nanolabs/management';
async function read(resource,extra={}){const j=await raw(endpoint+'?'+new URLSearchParams({resource,...extra}));assert.equal(j.contract,'nanolabs.saas.management.v1');assert.equal(j.product,'onlycars');return j.data;}
async function command(operation,input,{requestId=crypto.randomUUID(),status=200}={}){return raw(endpoint,{method:'POST',body:{requestId,actor,operation,input},status});}
async function detail(id){return read('tenant',{tenantId:id});}
async function change(id,operation,input={},options={}){const t=await detail(id);return command(operation,{tenantId:id,version:t.version,...input},options);}
async function native(path,{host,cookie,status}){const r=await fetch(new URL(path,base),{headers:{'X-Forwarded-Host':host,...(cookie?{Cookie:cookie}:{})},redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,status,path);assertions++;return r.text();}
async function plan(id){const page=await read('plans');return page.items.find(p=>p.id===id);}
async function main(){
 await raw(endpoint+'?resource=catalog',{token:'wrong',status:401});await raw(endpoint+'?resource=catalog',{signature:false,status:401});await raw(endpoint+'?resource=catalog',{token:readKey,status:401});
 await raw('/api/integrations/nanolabs/tenants?offset=0',{token:readKey,signature:false});await raw('/api/integrations/nanolabs/tenants?offset=-1',{token:readKey,signature:false,status:422});
 const before=JSON.stringify(await db.tenant.findMany({orderBy:{id:'asc'},select:{id:true,status:true,updatedAt:true,subscription:{select:{status:true,updatedAt:true}}}})),beforeAudit=await db.platformAuditLog.count();
 const catalog=await read('catalog');assert.equal(catalog.currency,'USD');assert.deepEqual(catalog.modules,modules);assert(catalog.operations.includes('domain.add'));assert.equal(catalog.destructiveDelete,false);await read('plans');
 assert.equal(JSON.stringify(await db.tenant.findMany({orderBy:{id:'asc'},select:{id:true,status:true,updatedAt:true,subscription:{select:{status:true,updatedAt:true}}}})),before);assert.equal(await db.platformAuditLog.count(),beforeAudit);
 const planInput={code:'QA-'+nonce.toUpperCase(),name:'QA OnlyCars '+nonce,description:'Isolated fixture',priceCents:1550,currency:'USD',active:true,modules:Object.fromEntries(modules.map(k=>[k,true])),limits:{maxVehicles:20,maxLocations:2,maxUsers:5}},requestId=crypto.randomUUID();
 const duplicate=await Promise.all([command('plan.create',planInput,{requestId}),command('plan.create',planInput,{requestId})]);assert.equal(duplicate[0].data.planId,duplicate[1].data.planId);const planId=duplicate[0].data.planId;assert.equal(await db.plan.count({where:{code:planInput.code}}),1);
 await command('plan.create',{...planInput,name:'Conflict'},{requestId,status:409});
 const password='Fixture-only-'+crypto.randomBytes(12).toString('hex'),start=new Date(Date.now()-60000).toISOString(),end=new Date(Date.now()+30*86400000).toISOString();
 const createA={name:'QA agency A '+nonce,slug:'qa-a-'+nonce,planId,ownerName:'QA Owner A',ownerEmail:'qa-a-'+nonce+'@example.invalid',password,status:'ACTIVE',start,end};
 const createId=crypto.randomUUID(),created=await Promise.all([command('tenant.create',createA,{requestId:createId}),command('tenant.create',createA,{requestId:createId})]);assert.equal(created[0].data.tenantId,created[1].data.tenantId);const a=created[0].data.tenantId;
 const b=(await command('tenant.create',{...createA,name:'QA agency B '+nonce,slug:'qa-b-'+nonce,ownerName:'QA Owner B',ownerEmail:'qa-b-'+nonce+'@example.invalid'})).data.tenantId;
 let t=await detail(a);assert.equal(t.access.enabled,true);assert.equal(t.plan.currency,'USD');assert.equal(t.plan.priceCents,1550);assert.equal(t.admins.length,1);assert.equal(t.domains.length,1);assert(!JSON.stringify(t).includes('passwordHash'));
 const adminId=t.admins[0].id,host=t.domains[0].hostname,session=crypto.randomBytes(32).toString('hex'),cookie='onlycars_user_session='+session;
 await db.userSession.create({data:{userId:adminId,tokenHash:crypto.createHash('sha256').update(session).digest('hex'),expiresAt:new Date(Date.now()+86400000)}});
 const stale=t.version;await change(a,'tenant.update',{name:'QA renamed '+nonce,slug:t.slug,email:'profile-'+nonce+'@example.invalid',phone:'fixture',city:'Fixture city',address:'Fixture address',cuit:'fixture'});
 await command('tenant.status',{tenantId:a,version:stale,status:'SUSPENDED'},{status:409});await change(a,'tenant.update',{name:t.name,slug:'renamed-forbidden'},{status:422});
 await db.tenantFeature.upsert({where:{tenantId_featureKey:{tenantId:a,featureKey:'seller_pwa'}},update:{config:{fixture:'preserved'}},create:{tenantId:a,featureKey:'seller_pwa',isEnabled:true,config:{fixture:'preserved'}}});
 await change(a,'module.set',{key:'seller_pwa',enabled:false,limit:null});t=await detail(a);assert.equal(t.modules.seller_pwa.enabled,false);assert.deepEqual((await db.tenantFeature.findUnique({where:{tenantId_featureKey:{tenantId:a,featureKey:'seller_pwa'}}})).config,{fixture:'preserved'});
 await native('/api/pwa/manifest/seller',{host,status:404});await native('/pwa/dashboard',{host,cookie,status:404});const adminHtml=await native('/pwa/admin',{host,cookie,status:200});assert(!/<a[^>]+href="\/pwa\/dashboard"/.test(adminHtml));
 await change(a,'module.set',{key:'seller_pwa',enabled:null,limit:null});assert.equal((await detail(a)).modules.seller_pwa.override,null);
 await db.plan.update({where:{id:planId},data:{features:[...modules,'historical-fixture']}});let p=await plan(planId);
 await command('plan.update',{...planInput,code:undefined,planId,version:p.version,modules:{...planInput.modules,seller_pwa:false}}); // JSON omits undefined.
 t=await detail(a);assert.equal(t.modules.seller_pwa.enabled,false);assert((await db.plan.findUnique({where:{id:planId}})).features.includes('historical-fixture'));
 await change(a,'module.set',{key:'seller_pwa',enabled:true,limit:null});await native('/api/pwa/manifest/seller',{host,status:200});await native('/pwa/dashboard',{host,cookie,status:200});
 await change(a,'subscription.update',{planId,status:'TRIAL',start,end,trialEndsAt:null},{status:422});await change(a,'subscription.update',{planId,status:'TRIAL',start,end,trialEndsAt:end});assert.equal((await detail(a)).status,'TRIAL');
 const paymentsBefore=await db.saaSPayment.count({where:{tenantId:a}});await change(a,'subscription.renew',{days:10});assert.equal((await detail(a)).status,'ACTIVE');assert.equal(await db.saaSPayment.count({where:{tenantId:a}}),paymentsBefore);
 const ref='qa-payment-'+nonce,payment={amountCents:12345,currency:'USD',method:'fixture',reference:ref,notes:'isolated fixture',start,end,paidAt:null};t=await detail(a);const payId=crypto.randomUUID(),payCmd={tenantId:a,version:t.version,...payment};
 const paid=await Promise.all([command('payment.record',payCmd,{requestId:payId}),command('payment.record',payCmd,{requestId:payId})]);assert.equal(paid[0].data.paymentId,paid[1].data.paymentId);assert.equal(await db.saaSPayment.count({where:{reference:ref}}),1);assert.equal((await db.saaSPayment.findFirst({where:{reference:ref}})).currency,'USD');
 await change(a,'payment.record',payment,{status:409});await change(a,'payment.record',{...payment,reference:ref+'-invalid',amountCents:0},{status:422});
 const previousPeriod=(await detail(a)).subscription.end;await change(a,'payment.record',{...payment,reference:ref+'-historic',start:new Date(Date.now()-60*86400000).toISOString(),end:new Date(Date.now()-30*86400000).toISOString()});assert.equal((await detail(a)).subscription.end,previousPeriod);
 await change(a,'domain.add',{hostname:'qa-domain-'+nonce+'.example.invalid',custom:true,primary:false,confirmOwnership:true});assert.equal((await detail(a)).domains.length,2);await change(a,'domain.add',{hostname:'onlyfood.nanoapps.ar',custom:true,primary:false,confirmOwnership:true},{status:422});
 await change(a,'tenant.status',{status:'SUSPENDED'});assert.equal((await detail(a)).access.enabled,false);await change(a,'tenant.status',{status:'ACTIVE'});
 const newPassword='Changed-fixture-'+crypto.randomBytes(12).toString('hex');await change(a,'admin.update',{userId:adminId,name:'QA updated',email:'qa-updated-'+nonce+'@example.invalid',password:newPassword});assert.equal(await db.userSession.count({where:{userId:adminId}}),0);const saved=await db.user.findUnique({where:{id:adminId}});assert(saved.passwordHash.startsWith('scrypt$'));
 const other=(await detail(b)).admins[0];await change(a,'admin.revoke',{userId:other.id},{status:403});
 await db.tenantMembership.create({data:{tenantId:b,userId:adminId,role:'OWNER'}});await change(a,'admin.revoke',{userId:adminId},{status:409});await change(a,'admin.update',{userId:adminId,name:'forbidden',email:saved.email},{status:409});assert.equal((await db.user.findUnique({where:{id:adminId}})).name,'QA updated');
 await db.subscription.update({where:{tenantId:a},data:{status:'ACTIVE',currentPeriodStart:new Date(Date.now()-20*86400000),currentPeriodEnd:new Date(Date.now()-86400000)}});await db.tenant.update({where:{id:a},data:{status:'ACTIVE'}});
 const expired=await detail(a);assert.equal(expired.access.enabled,false);assert.equal(expired.status,'PAST_DUE');await raw('/api/integrations/nanolabs/tenants?offset=0',{token:readKey,signature:false});assert.equal((await db.tenant.findUnique({where:{id:a}})).status,'ACTIVE');assert.equal((await db.subscription.findUnique({where:{tenantId:a}})).status,'ACTIVE');
 const audit=await read('audit',{tenantId:a});assert(audit.items.some(e=>e.actor===actor));assert(!JSON.stringify(audit).includes(password));assert(!JSON.stringify(audit).includes(newPassword));const receipt=await db.platformAuditLog.findUnique({where:{id:'hub-command:'+payId}});assert(!JSON.stringify(receipt.details).includes(password));
 await change(b,'module.set',{key:'seller_pwa',enabled:true,limit:null});
 if(process.env.HUB_TEST_UI_FIXTURE){
  const rootEmail='qa-platform-'+nonce+'@example.invalid',salt=crypto.randomBytes(16).toString('hex'),hash='scrypt$'+salt+'$'+crypto.scryptSync(password,salt,64).toString('hex');
  await db.user.create({data:{name:'QA Platform',email:rootEmail,passwordHash:hash,isSuperAdmin:true}});
  const fixture={platformHost:platform,platformEmail:rootEmail,tenantHost:(await detail(b)).domains[0].hostname,tenantEmail:'qa-b-'+nonce+'@example.invalid',tenantId:b,password};
  fs.writeFileSync(process.env.HUB_TEST_UI_FIXTURE,JSON.stringify(fixture),{mode:0o600});
 }
 const out={assertions,fixture:true,product:'onlycars',pureReads:true,idempotency:true,versions:true,sharedAccountIsolation:true,historicalConfigPreserved:true,modulesEnforced:true,usdPreserved:true,paymentReferenceUnique:true,historicalPaymentDoesNotReactivate:true,domainsPreserved:true,productionWrites:0};
 if(process.env.HUB_TEST_REPORT)fs.writeFileSync(process.env.HUB_TEST_REPORT,JSON.stringify(out,null,2),{mode:0o600});console.log(JSON.stringify(out));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.$disconnect());
