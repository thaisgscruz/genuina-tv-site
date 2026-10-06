import {PLANS,DEVICES,EXTRAS,money,calculateOrder,whatsappUrl} from './model.mjs';
import {PIX} from './pix.mjs';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const icon=(name,cls='')=>`<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const checkout=$('#checkout');
const content=$('#checkout-content');
const state={plan:null,device:null,extra:0,adult:false,step:0};
let trigger=null;
let toastTimer;

function toast(message){const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500);}
function error(message){const el=$('#checkout-error');el.textContent=message;el.hidden=!message;}
function openCheckout(plan=null){
  if(plan!==null&&(typeof plan!=='string'||!Object.hasOwn(PLANS,plan))) throw new Error('Plano inválido.');
  trigger=document.activeElement;
  if(state.plan!==plan){state.plan=plan;state.extra=0;}
  state.step=plan?1:0;
  error('');
  renderCheckout(false);
  if(!checkout.open)checkout.showModal();
  document.body.classList.add('modal-open');
  checkout.scrollTop=0;
}
function closeCheckout(){checkout.close();document.body.classList.remove('modal-open');trigger?.focus?.();}
function order(){return calculateOrder(state.plan,state.extra,state.device,state.adult);}
function heading(title,description){return `<div class="checkout-heading"><span class="eyebrow">MONTE SEU PRÓXIMO PLAY</span><h2 id="checkout-title" tabindex="-1">${title}</h2><p>${description}</p></div>`;}
function miniSummary(){const o=order();return `<div class="checkout-summary-mini">Total mensal<strong>${money(o.total)}</strong></div>`;}
function check(selected){return `<span class="selection-check">${selected?icon('check'):''}</span>`;}
function planStrip(){return `<div class="selected-plan-strip"><span>Plano <strong>${PLANS[state.plan].name}</strong> · ${money(PLANS[state.plan].price)}/mês</span><button data-action="change-plan">Alterar</button></div>`;}
function renderCheckout(focus=true){
  error('');
  $$('.checkout-progress li').forEach((li,i)=>{li.classList.toggle('active',i===state.step);li.classList.toggle('complete',i<state.step);if(i===state.step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  if(state.step===0){
    content.innerHTML=heading('Escolha seu plano','Uma mensalidade, muitas possibilidades.')+`<div class="mini-plans">${Object.values(PLANS).map(p=>`<button class="choice-card" data-choose-plan="${p.id}">${icon(p.id==='gold'?'crown':'film','device-icon')}<b>${p.name}</b><strong>${money(p.price)}</strong><small>por mês · 1 acesso</small></button>`).join('')}</div>`;
  }else if(state.step===1){
    content.innerHTML=heading('Onde vai ser o seu play?','Escolha o dispositivo principal. A gente orienta você na configuração.')+planStrip()+`<div class="device-grid" role="group" aria-label="Dispositivo principal">${DEVICES.map(d=>`<button class="choice-card ${state.device===d.id?'selected':''}" data-device="${d.id}" aria-pressed="${state.device===d.id}">${check(state.device===d.id)}${icon(d.icon,'device-icon')}<b>${d.name}</b><small>${d.description}</small></button>`).join('')}</div><p class="device-note">O aplicativo e a compatibilidade podem variar conforme o modelo. Confirme com o atendimento antes de pagar.</p><div class="checkout-actions"><button class="back-button" data-action="change-plan">← Voltar</button>${miniSummary()}<button class="button" data-action="to-extras" ${state.device?'':'disabled'}>Continuar ${icon('arrow')}</button></div>`;
  }else if(state.step===2){
    content.innerHTML=heading('Tem espaço para mais um play.','Adicione acessos ao seu plano ou siga com o acesso individual.')+planStrip()+`<div class="extras-grid" role="group" aria-label="Acessos adicionais">${EXTRAS.map(e=>`<button class="choice-card ${state.extra===e.id?'selected':''}" data-extra="${e.id}" aria-pressed="${state.extra===e.id}">${check(state.extra===e.id)}${icon(e.icon,'device-icon')}<b>${e.name}</b><small>${e.subtitle}</small><strong>${e.price?'+ '+money(e.price):'Sem extra'}${e.price?'<small>/mês</small>':''}</strong></button>`).join('')}</div><label class="adult-choice"><input type="checkbox" id="adult-option" ${state.adult?'checked':''}><span>Quero habilitar os canais +18.<small>Ao marcar, declaro ter 18 anos ou mais. A ativação é opcional e não altera o preço.</small></span></label><div class="checkout-actions"><button class="back-button" data-action="back-device">← Voltar</button><button class="back-button" data-action="skip-extras">Pular extras</button>${miniSummary()}<button class="button" data-action="to-payment">Ir para pagamento ${icon('arrow')}</button></div>`;
  }else if(state.step===3){
    const o=order();
    if(!o.device){state.step=1;return renderCheckout(focus);}
    const variable=o.pixType==='extras';
    content.innerHTML=heading('Falta pouco para o seu primeiro play.','Pague com Pix e envie o comprovante no WhatsApp para ativar seu acesso.')+`<div class="payment-grid"><section class="pix-panel" aria-label="Pagamento Pix"><span>Valor exato deste pedido</span><strong class="pix-total">${money(o.total)}</strong>${variable?`<p class="manual-amount">Este QR Code não tem valor preenchido.<br>No banco, digite <strong>${money(o.total)}</strong> antes de confirmar.</p>`:''}<div class="qr-frame"><img src="./assets/pix-${o.pixType}.png" alt="QR Code Pix ${variable?'sem valor fixo para pedido de '+money(o.total):'do plano '+o.plan.name+' no valor de '+money(o.total)}" width="240" height="240"></div><button class="button button-outline full-width" data-action="copy-pix">${icon('copy')} Copiar código Pix</button><textarea class="copy-fallback" id="pix-fallback" aria-label="Código Pix para copiar manualmente" rows="4" readonly hidden></textarea><p class="pix-receiver">Confira o recebedor no seu banco:<strong>Thais Goncalves de Souza</strong></p></section><section class="order-summary" aria-label="Resumo do pedido"><h3>Seu pedido</h3><dl class="order-lines"><div><dt>Plano ${o.plan.name}</dt><dd>${money(o.plan.price)}</dd></div><div><dt>Dispositivo</dt><dd>${o.device.label}</dd></div><div><dt>${o.extras.additional?o.extras.additional+' acesso(s) adicional(is)':'Sem acessos extras'}</dt><dd>${money(o.extras.price)}</dd></div><div><dt>Acessos no total</dt><dd>${o.accesses}</dd></div><div><dt>Canais +18</dt><dd>${o.adult?'Solicitar ativação':'Não habilitar'}</dd></div><div class="sum-total"><dt>Total mensal</dt><dd><strong>${money(o.total)}</strong></dd></div></dl><ol class="payment-howto"><li>Abra o banco e escolha <strong>Pix → Pagar com QR Code ou Copia e Cola.</strong></li><li>${variable?'Digite <strong>'+money(o.total)+'</strong> e confira':'Confira'} o valor e o nome do recebedor antes de confirmar.</li><li>Salve o comprovante. Abra o WhatsApp pelo botão abaixo e <strong>anexe o arquivo na conversa.</strong></li></ol><a class="button whatsapp-button" href="${whatsappUrl(o)}" target="_blank" rel="noopener noreferrer">${icon('chat')} Enviar comprovante no WhatsApp</a><p class="payment-note">A mensagem leva o resumo do pedido. O comprovante é anexado por você no WhatsApp. O pagamento e a ativação serão confirmados pelo atendimento.</p></section></div><div class="checkout-actions"><button class="back-button" data-action="back-extras">← Alterar meu pedido</button><span class="small muted">${icon('shield')} Pagamento no aplicativo do seu banco</span></div>`;
  }
  if(focus){checkout.scrollTop=0;$('#checkout-title')?.focus({preventScroll:true});}
}

document.addEventListener('click',e=>{
  const target=e.target.closest('[data-plan]');
  if(target){openCheckout(target.dataset.plan);return;}
});
content.addEventListener('click',async e=>{
  const el=e.target.closest('button');if(!el)return;
  try{
    if(el.dataset.choosePlan){state.plan=el.dataset.choosePlan;state.step=1;state.extra=0;renderCheckout();return;}
    if(el.dataset.device){
      if(!DEVICES.some(d=>d.id===el.dataset.device))return;
      state.device=el.dataset.device;
      const scroll=checkout.scrollTop;renderCheckout(false);checkout.scrollTop=scroll;$(`[data-device="${state.device}"]`,content)?.focus({preventScroll:true});return;
    }
    if(el.dataset.extra!==undefined){
      const v=Number(el.dataset.extra);if(!EXTRAS.some(x=>x.id===v))return;
      state.extra=v;const scroll=checkout.scrollTop;renderCheckout(false);checkout.scrollTop=scroll;$(`[data-extra="${v}"]`,content)?.focus({preventScroll:true});return;
    }
    switch(el.dataset.action){
      case 'change-plan':state.step=0;break;
      case 'to-extras':if(!state.device)throw new Error('Escolha um dispositivo para continuar.');state.step=2;break;
      case 'back-device':state.step=1;break;
      case 'skip-extras':state.extra=0;state.step=3;break;
      case 'to-payment':state.step=3;break;
      case 'back-extras':state.step=2;break;
      case 'copy-pix':{
        const code=PIX[order().pixType];
        try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(code);el.innerHTML=icon('check')+' Código copiado';setTimeout(()=>{if(el.isConnected)el.innerHTML=icon('copy')+' Copiar código Pix';},2800);}
        catch{const field=$('#pix-fallback');field.hidden=false;field.value=code;field.focus();field.select();el.innerHTML=icon('copy')+' Selecione e copie o código abaixo';}
        return;
      }
      default:return;
    }
    renderCheckout();
  }catch(err){error(err.message||'Não foi possível continuar. Tente novamente.');}
});
content.addEventListener('change',e=>{if(e.target.id==='adult-option')state.adult=e.target.checked;});
$('#close-checkout').addEventListener('click',closeCheckout);
$('#checkout-home').addEventListener('click',closeCheckout);
checkout.addEventListener('close',()=>document.body.classList.remove('modal-open'));
checkout.addEventListener('click',e=>{if(e.target===checkout){const r=checkout.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCheckout();}});

const menuButton=$('#menu-toggle');
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');$('#mobile-nav').hidden=!open;});
$$('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{$('#mobile-nav').hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menu');}));
$$('.genre-filter').forEach(button=>button.addEventListener('click',()=>{
  const genre=button.dataset.genre;
  $$('.genre-filter').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $$('.content-card').forEach(card=>card.hidden=genre!=='todos'&&card.dataset.category!==genre);
  $('#content-grid').classList.toggle('filtered',genre!=='todos');
}));
const privacy=$('#privacy-dialog');$('#privacy-button').addEventListener('click',()=>privacy.showModal());$('.close-privacy').addEventListener('click',()=>privacy.close());

// These tools stage the same visible choices. They do not pay or send messages.
const modelContext=document.modelContext;
if(modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[
    {name:'read_genuina_plans',title:'Consultar planos Genuína TV',description:'Consulta planos, dispositivos, extras e preços em centavos, sem alterar o pedido.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({plans:Object.values(PLANS),devices:DEVICES,extras:EXTRAS})},
    {name:'stage_genuina_order',title:'Preparar pedido Genuína TV',description:'Prepara as escolhas e abre o resumo com Pix na tela. Não paga, não envia mensagem e não confirma a contratação.',inputSchema:{type:'object',properties:{plan:{type:'string',enum:['bronze','gold']},device:{type:'string',enum:DEVICES.map(d=>d.id)},extras:{type:'integer',enum:[0,1,2]}},required:['plan','device','extras'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{
      if(!input||Object.keys(input).some(k=>!['plan','device','extras'].includes(k))||typeof input.device!=='string'||!Object.hasOwn(input,'plan')||!Object.hasOwn(input,'extras'))throw new Error('Parâmetros inválidos.');
      const result=calculateOrder(input.plan,input.extras,input.device,false);if(!result.device)throw new Error('Dispositivo obrigatório.');
      openCheckout(result.plan.id);state.device=result.device.id;state.extra=result.extras.id;state.adult=false;state.step=3;renderCheckout();
      return {status:'staged',plan:result.plan.id,device:result.device.id,accesses:result.accesses,totalCents:result.total,paymentConfirmed:false};
    }}
  ];
  for(const tool of tools){try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
