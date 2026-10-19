#!/usr/bin/env node
// Preparador interno: importar não executa instalação. Nenhum shell/login automático.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const defaultStateDir = () => path.join(process.env.STILO_HOME || path.join(os.homedir(), '.stilo'), 'setup');
const result = (status, reason, extra={}) => ({status,executable:null,version:null,restartRequired:false,reason,...extra});
const success = r => r && (r.code ?? r.status) === 0 && !r.error && !r.timedOut;
const missing = r => r && r.error && r.error.code === 'ENOENT';
const version = r => success(r) && /^gh version \d+\.\d+/m.test(r.stdout || '');
function realRun(file,args,options={}) {
  return new Promise(resolve=>{
    let stdout='',stderr='',timedOut=false,error=null,settled=false;
    const child=spawn(file,args,{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,HOMEBREW_NO_AUTO_UPDATE:'1',DEBIAN_FRONTEND:'noninteractive'}});
    const finish=code=>{
      if(settled)return; settled=true; clearTimeout(timer);
      // Parada do pai não comprova parada de instalador descendente.
      resolve({code,stdout,stderr,error,timedOut,stopped:!timedOut});
    };
    const timer=setTimeout(()=>{
      timedOut=true;
      try { child.kill(); } catch(e) { error={code:e.code,message:e.message}; }
      // O controlador deixa de aguardar close, sem alegar parada nem liberar o lock.
      child.stdout.destroy(); child.stderr.destroy(); child.unref();
      finish(null);
    }, options.timeout || 1000);
    child.stdout.on('data',data=>{stdout=(stdout+data).slice(-16000);});
    child.stderr.on('data',data=>{stderr=(stderr+data).slice(-16000);});
    child.on('error',e=>{error={code:e.code,message:e.message};});
    child.on('close',finish);
  });
}
function readReceipt(stateDir) {
  const file=path.join(stateDir,'github-cli.json');
  try {
    const r=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!r || r.versionSchema!==1 || !['available','installed','pending','failed'].includes(r.status) || typeof r.reason!=='string') return {invalid:true};
    return r;
  } catch(error) { return error.code==='ENOENT' ? null : {invalid:true}; }
}
function knownWindowsExecutable() {
  return path.win32.join(process.env.ProgramFiles || 'C:\\Program Files','GitHub CLI','gh.exe');
}
async function ensureGitHubCli({platform=process.platform,run=realRun,stateDir=defaultStateDir(),retry=false,exists=fs.existsSync}={}) {
  const invoke=async(file,args,timeout=1000)=>{
    try { return await run(file,args,{timeout,shell:false,windowsHide:true}); }
    catch(error){return {error:{code:error.code,message:error.message},stderr:error.message,stopped:false};}
  };
  const executable=platform==='win32'?'gh.exe':'gh';
  const detected=await invoke(executable,['--version']);
  if(version(detected)) return result('available','Executável existente validado; autenticação não consultada.',{executable,version:detected.stdout.trim()});
  // Somente ENOENT autoriza tentar instalação, nunca erro de um executável existente.
  if(!missing(detected)) return result('pending',`Falha ao detectar gh: ${detected.stderr || detected.error?.message || 'versão inválida'}`);
  if(platform==='win32' && exists(knownWindowsExecutable())) {
    const known=await invoke(knownWindowsExecutable(),['--version']);
    if(version(known)) return result('available','Executável existente fora do PATH; reinicie a sessão.',{executable:knownWindowsExecutable(),version:known.stdout.trim(),restartRequired:true});
    return result('pending','Executável no diretório padrão não pôde ser validado.');
  }
  const receipt=readReceipt(stateDir);
  if(receipt?.invalid) return result('pending','Receipt inválido; conferir manualmente sem sobrescrever.');
  if(receipt && !retry) return result('pending',`Tentativa já registrada (${receipt.status}): ${receipt.reason}; nova tentativa exige pedido explícito.`);
  let token,lock,keepLock=false;
  try {
    fs.mkdirSync(stateDir,{recursive:true}); lock=path.join(stateDir,'github-cli.lock'); token=crypto.randomUUID();
    try { fs.writeFileSync(lock,JSON.stringify({token,pid:process.pid,updated:new Date().toISOString()}),{flag:'wx'}); }
    catch(error){ token=null; return result('pending',`Lock existente ou indisponível: ${error.code}; confirmar proprietário, sem takeover.`); }
    // Conferir receipt novamente sob posse: outro preparador pode ter terminado entre probe e lock.
    const lockedReceipt=readReceipt(stateDir);
    if(lockedReceipt?.invalid) return result('pending','Receipt inválido; conferir manualmente sem sobrescrever.');
    if(lockedReceipt && !retry) return result('pending',`Preparação já registrada: ${lockedReceipt.reason}`);
    let installedResult;
    const prepare=async()=>{
      let manager,args;
      if(platform==='win32') { manager='winget.exe'; args=['install','--id','GitHub.cli','--source','winget','--exact','--silent','--disable-interactivity','--accept-source-agreements','--accept-package-agreements']; }
      else if(platform==='darwin') { manager='brew'; args=['install','gh']; }
      else if(platform==='linux') {
        if(success(await invoke('apt-get',['--version']))) {
          const policy=await invoke('apt-cache',['policy','gh']);
          if(!success(policy)||!/^\s*Candidate:\s*(?!\(none\))\S+/m.test(policy.stdout||'')) return result('pending','Pacote gh indisponível no repositório apt configurado.');
          manager='apt-get';args=['install','-y','gh'];
        } else if(success(await invoke('dnf',['--version']))) {
          if(!success(await invoke('dnf',['--cacheonly','info','gh']))) return result('pending','Pacote gh indisponível no repositório dnf configurado.');
          manager='dnf';args=['install','-y','gh'];
        } else return result('pending','Linux sem apt/dnf suportado; consulte https://github.com/cli/cli#installation');
        const uid=await invoke('id',['-u']);
        if(!success(uid)||uid.stdout.trim()!=='0') return result('pending','Instalação exige privilégio: usar aprovação/elevação permitida pelo host, sem sudo automático.');
      } else return result('pending','Sistema não suportado; consulte https://github.com/cli/cli#installation');
      if(!success(await invoke(manager,['--version']))) return result('pending',`Gerenciador ${manager} indisponível; não instalar outro gerenciador.`);
      const installation=await invoke(manager,args,180000);
      if(!success(installation)) {
        keepLock=installation.stopped===false;
        return result(installation.timedOut?'pending':'failed',`${installation.timedOut?'timeout; confirmar parada dos processos. ':''}${installation.stderr || installation.error?.message || 'instalação falhou'}`);
      }
      const checked=await invoke(executable,['--version']);
      if(version(checked)) return result('installed','Instalação confirmada pelo executável; login é etapa separada.',{executable,version:checked.stdout.trim()});
      if(platform==='win32' && exists(knownWindowsExecutable())) {
        const located=await invoke(knownWindowsExecutable(),['--version']);
        if(version(located)) return result('installed','Instalação confirmada no diretório padrão; reinicie a sessão para atualizar PATH.',{executable:knownWindowsExecutable(),version:located.stdout.trim(),restartRequired:true});
      }
      return result('pending','Gerenciador terminou, mas gh não pôde ser validado; conferir PATH e instalação.',{restartRequired:platform==='win32'});
    };
    installedResult=await prepare();
    const temp=path.join(stateDir,`github-cli.${token}.tmp`);
    fs.writeFileSync(temp,JSON.stringify({versionSchema:1,...installedResult,updated:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
    fs.renameSync(temp,path.join(stateDir,'github-cli.json'));
    return installedResult;
  } catch(error) { return result('pending',`Preparação indisponível: ${error.message}`); }
  finally {
    if(token && !keepLock) {
      try { if(JSON.parse(fs.readFileSync(lock,'utf8')).token===token) fs.unlinkSync(lock); } catch { /* Não remover lock alheio. */ }
    }
  }
}
async function main(argv=process.argv.slice(2)) {
  if(argv.some(arg=>arg!=='--retry') || argv.length>1) {console.error('Uso: node scripts/setup-github-cli.js [--retry solicitado explicitamente]');return 2;}
  const r=await ensureGitHubCli({retry:argv.includes('--retry')}); console.log(JSON.stringify(r,null,2)); return ['available','installed'].includes(r.status)?0:1;
}
if(require.main===module) main().then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={ensureGitHubCli,main,realRun,readReceipt,defaultStateDir,knownWindowsExecutable};
