// Somente probe de leitura; nenhum gerenciador de pacotes é chamado em hooks.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {defaultStateDir,readReceipt}=require('../scripts/setup-github-cli');
function probeGitHubCli({run=spawnSync,stateDir=defaultStateDir()}={}) {
  try {
    const r=run(process.platform==='win32'?'gh.exe':'gh',['--version'],{timeout:1000,shell:false,windowsHide:true,encoding:'utf8'});
    if((r.status??r.code)===0 && /^gh version \d+\.\d+/m.test(r.stdout||'')) return {status:'available',reason:'Versão existente confirmada.'};
    if(!r.error || r.error.code!=='ENOENT') return {status:'pending',reason:'Probe indisponível ou executável existente com erro.'};
    if(fs.existsSync(path.join(stateDir,'github-cli.lock'))) return {status:'pending',reason:'Lock existente; confirmar proprietário.'};
    const receipt=readReceipt(stateDir);
    if(receipt) return {status:'pending',reason:receipt.invalid?'Receipt inválido.':`Preparação já registrada: ${receipt.status}.`};
    return {status:'absent',reason:'gh ausente e nenhuma tentativa registrada.'};
  } catch {return {status:'pending',reason:'Probe indisponível; pipeline continua.'};}
}
function buildSetupNote(pluginRoot,probe) {
  if(!probe || probe.status!=='absent') return '';
  return [
    '## Preparação pendente do GitHub CLI',
    'Na primeira ativação suportada, prepare gh fora do hook pelas ferramentas normais do agente.',
    `Executável: node; argumentos separados: ${JSON.stringify([path.join(pluginRoot,'scripts','setup-github-cli.js')])}.`,
    'Respeite permissões do host. Sem --retry automático. Releia receipt/lock antes de agir.',
    'Não repetir por /clear, resume ou subagente. A instalação é distinta da autenticação; não iniciar login.',
  ].join('\n');
}
module.exports={probeGitHubCli,buildSetupNote};
