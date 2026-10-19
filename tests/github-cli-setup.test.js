const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const SCRIPT = path.join(__dirname, '../scripts/setup-github-cli');
function dir(t) { const d=fs.mkdtempSync(path.join(os.tmpdir(),'stilo setup & ')); t.after(()=>fs.rmSync(d,{recursive:true,force:true})); return d; }
const absent = () => ({code:null,stdout:'',stderr:'',error:{code:'ENOENT',message:'ausente'}});
const ok = stdout => ({code:0,stdout,stderr:''});
function fake({present=false,fail=null,after=true,manager=true}={}) {
  const calls=[]; let installed=false;
  const run=async(file,args,options)=>{
    calls.push({file,args,options});
    if(path.basename(file).toLowerCase()==='gh.exe' || file==='gh') return present || (installed&&after) ? ok('gh version 2.88.0 (teste)') : absent();
    if(args.includes('install')) { installed=!fail; return fail || ok('feito'); }
    if(file==='id') return ok('0');
    if(file==='apt-cache') return ok('gh:\n Candidate: 2.88.0\n');
    return manager ? ok('gerenciador disponível') : absent();
  }; return {run,calls};
}
test('gh existente só é detectado e não exige login nem gerenciador', async t=>{
  const {ensureGitHubCli}=require(SCRIPT), f=fake({present:true});
  const r=await ensureGitHubCli({exists:()=>false,platform:'win32',run:f.run,stateDir:dir(t)});
  assert.equal(r.status,'available'); assert.match(r.version,/2\.88\.0/);
  assert.equal(f.calls.length,1); assert.deepEqual(f.calls[0].args,['--version']);
});
test('instala uma vez e confirma executável; repetir só detecta', async t=>{
  const {ensureGitHubCli}=require(SCRIPT), f=fake(), stateDir=dir(t);
  const r=await ensureGitHubCli({exists:()=>false,platform:'win32',run:f.run,stateDir});
  assert.equal(r.status,'installed'); assert.equal(fs.existsSync(path.join(stateDir,'github-cli.lock')),false);
  assert.equal((await ensureGitHubCli({exists:()=>false,platform:'win32',run:f.run,stateDir})).status,'available');
  const installs=f.calls.filter(c=>c.args.includes('install')); assert.equal(installs.length,1);
  assert.deepEqual(installs[0].args,['install','--id','GitHub.cli','--source','winget','--exact','--silent','--disable-interactivity','--accept-source-agreements','--accept-package-agreements']);
  assert.equal(installs[0].options.shell,false); assert.equal(installs[0].options.timeout,180000);
});
test('falha, permissão, rede e timeout nunca viram sucesso nem repetição automática', async t=>{
  const {ensureGitHubCli}=require(SCRIPT);
  for(const fail of [{code:1,stderr:'rede indisponível'},{code:5,stderr:'permissão negada'},{code:null,timedOut:true,stopped:false,stderr:'timeout'}]) {
    const stateDir=dir(t), f=fake({fail});
    const result=await ensureGitHubCli({exists:()=>false,platform:'win32',run:f.run,stateDir});
    assert.ok(['pending','failed'].includes(result.status)); assert.match(result.reason,/rede|permissão|timeout/i);
    await ensureGitHubCli({exists:()=>false,platform:'win32',run:f.run,stateDir}); assert.equal(f.calls.filter(c=>c.args.includes('install')).length,1);
    assert.equal(fs.existsSync(path.join(stateDir,'github-cli.lock')),fail.stopped===false);
  }
});
test('receipt inválido e lock alheio são preservados; detectar instalação posterior continua possível',async t=>{
  const {ensureGitHubCli}=require(SCRIPT);
  for(const name of ['github-cli.json','github-cli.lock']) {
    const stateDir=dir(t); fs.writeFileSync(path.join(stateDir,name),'invalido'); const f=fake();
    assert.equal((await ensureGitHubCli({exists:()=>false,platform:'win32',run:f.run,stateDir})).status,'pending');
    assert.equal(fs.readFileSync(path.join(stateDir,name),'utf8'),'invalido'); assert.equal(f.calls.length,1);
    assert.equal((await ensureGitHubCli({exists:()=>false,platform:'win32',run:fake({present:true}).run,stateDir})).status,'available');
  }
});
test('concorrência instala somente no proprietário',async t=>{
  const {ensureGitHubCli}=require(SCRIPT), stateDir=dir(t); let release, started;
  const gate=new Promise(r=>release=r), ready=new Promise(r=>started=r), f=fake();
  const run=async(...args)=>{if(args[1].includes('install')){started(); await gate;} return f.run(...args);};
  const first=ensureGitHubCli({exists:()=>false,platform:'win32',run,stateDir}); await ready;
  const second=await ensureGitHubCli({exists:()=>false,platform:'win32',run:f.run,stateDir}); assert.equal(second.status,'pending');
  release(); assert.equal((await first).status,'installed'); assert.equal(f.calls.filter(c=>c.args.includes('install')).length,1);
});
test('ambiente não suportado, gerenciador ausente e binário defeituoso não reinstalam',async t=>{
  const {ensureGitHubCli}=require(SCRIPT);
  for(const [platform,f] of [['freebsd',fake()],['darwin',fake({manager:false})],['win32',{calls:[],run:async()=>({code:2,stderr:'executável defeituoso'})}]]) {
    const r=await ensureGitHubCli({exists:()=>false,platform,run:f.run,stateDir:dir(t)}); assert.ok(['pending','failed'].includes(r.status));
    assert.equal(f.calls.filter(c=>c.args.includes('install')).length,0);
  }
});
test('macOS e Linux usam apenas gerenciador/repositório existente',async t=>{
  const {ensureGitHubCli}=require(SCRIPT);
  for(const platform of ['darwin','linux']) {
    const f=fake(); assert.equal((await ensureGitHubCli({exists:()=>false,platform,run:f.run,stateDir:dir(t)})).status,'installed');
    assert.ok(f.calls.some(c=>c.file===(platform==='darwin'?'brew':'apt-get')&&c.args.includes('install')));
    assert.ok(f.calls.every(c=>!c.args.includes('auth')&&!c.args.includes('sudo')));
  }
});
test('sucesso do gerenciador sem binário fica pendente e retry exige pedido explícito',async t=>{
  const {ensureGitHubCli}=require(SCRIPT), f=fake({after:false}), stateDir=dir(t);
  assert.equal((await ensureGitHubCli({exists:()=>false,platform:'darwin',run:f.run,stateDir})).status,'pending');
  await ensureGitHubCli({exists:()=>false,platform:'darwin',run:f.run,stateDir}); assert.equal(f.calls.filter(c=>c.args.includes('install')).length,1);
  await ensureGitHubCli({exists:()=>false,platform:'darwin',run:f.run,stateDir,retry:true}); assert.equal(f.calls.filter(c=>c.args.includes('install')).length,2);
});

test('PATH novo no Windows valida apenas diretório conhecido e informa reinício',async t=>{
  const {ensureGitHubCli,knownWindowsExecutable}=require(SCRIPT);
  let installed=false;const calls=[];
  const run=async(file,args)=>{
    calls.push(file);
    if(file==='gh.exe') return absent();
    if(file===knownWindowsExecutable()) return ok('gh version 2.88.0');
    if(args.includes('install')) installed=true;
    return ok('feito');
  };
  const r=await ensureGitHubCli({platform:'win32',run,stateDir:dir(t),exists:()=>installed});
  assert.equal(r.status,'installed');assert.equal(r.restartRequired,true);assert.equal(r.executable,knownWindowsExecutable());
  assert.equal(calls.at(-1),knownWindowsExecutable());
});

test('receipt não fornece executável e repositório/privilégio ausente não é sucesso',async t=>{
  const {ensureGitHubCli}=require(SCRIPT),stateDir=dir(t),f=fake();
  fs.writeFileSync(path.join(stateDir,'github-cli.json'),JSON.stringify({versionSchema:1,status:'failed',reason:'falhou',executable:'arbitrario.exe'}));
  await ensureGitHubCli({platform:'win32',run:f.run,stateDir,exists:()=>false});
  assert.deepEqual(f.calls.map(c=>c.file),['gh.exe']);
  for(const [file,response] of [['apt-cache',ok('Candidate: (none)')],['id',ok('1000')]]) {
    const base=fake(),run=(command,args,options)=>command===file?Promise.resolve(response):base.run(command,args,options);
    const r=await ensureGitHubCli({platform:'linux',run,stateDir:dir(t)});
    assert.equal(r.status,'pending');assert.equal(base.calls.filter(c=>c.args.includes('install')).length,0);
  }
});

test('timeout do executor retorna sem esperar descendente com pipes herdados',async()=>{
  const {realRun}=require(SCRIPT),start=Date.now();
  const r=await realRun(process.execPath,['-e',"require('node:child_process').spawn(process.execPath,['-e','setTimeout(()=>{},1800)'],{stdio:'inherit'});setTimeout(()=>{},1800)"],{timeout:250});
  assert.equal(r.timedOut,true);assert.equal(r.stopped,false);assert.ok(Date.now()-start<1300);
});

test('watchdog retorna timeout mesmo sem close e não confirma parada',async()=>{
  const vm=require('node:vm'),{EventEmitter}=require('node:events');
  const child=new EventEmitter();let kills=0,unrefs=0,destroyed=0;
  for(const stream of ['stdout','stderr']){child[stream]=new EventEmitter();child[stream].destroy=()=>{destroyed++;};}
  child.kill=()=>{kills++;return false;};child.unref=()=>{unrefs++;};
  const mod={exports:{}};
  new vm.Script(fs.readFileSync(SCRIPT+'.js','utf8')).runInNewContext({
    module:mod,require:name=>name==='node:child_process'?{spawn:()=>child}:require(name),
    process,console,setTimeout,clearTimeout,
  });
  const r=await Promise.race([mod.exports.realRun('sintetico',[],{timeout:20}),new Promise(resolve=>setTimeout(()=>resolve(null),200))]);
  assert.notEqual(r,null,'promessa aguardou close após timeout');assert.equal(r.timedOut,true);assert.equal(r.stopped,false);
  assert.equal(kills,1);assert.equal(unrefs,1);assert.equal(destroyed,2);
  child.emit('close',0);assert.equal(r.code,null);
});
