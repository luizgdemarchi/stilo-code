const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const SCRIPT=path.join(__dirname,'../hooks/stilo-setup');
function temp(t){const d=fs.mkdtempSync(path.join(os.tmpdir(),'stilo bootstrap & '));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;}
test('probe ausente só detecta e nota encaminha fora do hook com argumentos seguros',t=>{
  const {probeGitHubCli,buildSetupNote}=require(SCRIPT),stateDir=temp(t),calls=[];
  const probe=probeGitHubCli({stateDir,run:(file,args,options)=>{calls.push({file,args,options});return {error:{code:'ENOENT'}};}});
  assert.equal(probe.status,'absent');assert.equal(calls.length,1);assert.deepEqual(calls[0].args,['--version']);
  assert.equal(calls[0].options.shell,false);assert.ok(calls[0].options.timeout<=1000);
  const note=buildSetupNote('C:\\plugins & space',probe);
  assert.match(note,/fora do hook/);assert.match(note,/setup-github-cli\.js/);assert.match(note,/autenticação/);
  assert.deepEqual(fs.readdirSync(stateDir),[]);
});
test('probe não repete preparo bloqueado, inválido ou com lock e não confunde erro de binário com ausência',t=>{
  const {probeGitHubCli,buildSetupNote}=require(SCRIPT);
  for(const file of ['github-cli.lock','github-cli.json']){
    const stateDir=temp(t);fs.writeFileSync(path.join(stateDir,file),'invalido');
    const probe=probeGitHubCli({stateDir,run:()=>({error:{code:'ENOENT'}})});
    assert.equal(probe.status,'pending');assert.equal(buildSetupNote('root',probe),'');
  }
  assert.equal(probeGitHubCli({stateDir:temp(t),run:()=>({status:1,stderr:'erro'})}).status,'pending');
  assert.equal(probeGitHubCli({stateDir:temp(t),run:()=>({status:0,stdout:'gh version 2.88.0'})}).status,'available');
});
test('SessionStart conserva estado inválido e funciona sem projeto, sem instalação',t=>{
  const dir=temp(t);fs.mkdirSync(path.join(dir,'.stilo'));fs.writeFileSync(path.join(dir,'.stilo/state.json'),'invalido');
  const before=fs.readFileSync(path.join(dir,'.stilo/state.json'),'utf8');
  const r=spawnSync(process.execPath,[path.join(__dirname,'../hooks/stilo-activate.js')],{cwd:dir,encoding:'utf8',env:{...process.env,STILO_HOME:path.join(dir,'home')}});
  assert.equal(r.status,0);assert.match(r.stdout,/ilegível/);assert.match(r.stdout,/Preparação do ambiente/);
  assert.equal(fs.readFileSync(path.join(dir,'.stilo/state.json'),'utf8'),before);
  assert.equal(fs.existsSync(path.join(dir,'home/setup/github-cli.json')),false);
});
