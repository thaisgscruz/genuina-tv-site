export const PLANS = Object.freeze({
  bronze: Object.freeze({id:'bronze', name:'BRONZE', price:3500}),
  gold: Object.freeze({id:'gold', name:'GOLD (Ouro)', price:4000})
});
export const DEVICES = Object.freeze([
  {id:'smart-tv',name:'Smart TV',description:'Samsung / LG',label:'Smart TV Samsung / LG',icon:'tv'},
  {id:'android-tv',name:'Android TV',description:'TV com sistema Android',label:'Android TV',icon:'android'},
  {id:'tv-box',name:'TV Box / Stick',description:'Fire Stick, MXQ 4K, Xiaomi',label:'TV Box / Stick (Fire Stick, MXQ 4K, Xiaomi TV Stick)',icon:'box'},
  {id:'computer',name:'PC / Notebook',description:'Seu computador',label:'PC / Notebook',icon:'laptop'},
  {id:'android-phone',name:'Celular Android',description:'Smartphone ou tablet',label:'Celular Android',icon:'phone'},
  {id:'ios-phone',name:'Celular iOS',description:'iPhone ou iPad',label:'Celular iOS (iPhone / iPad)',icon:'phone'},
  {id:'ps5',name:'PlayStation 5',description:'PS5',label:'PS5',icon:'game'}
]);
export const EXTRAS = Object.freeze([
  {id:0,name:'Só para mim',subtitle:'1 acesso no total',price:0,additional:0,icon:'play'},
  {id:1,name:'Incluir segundo acesso',subtitle:'2 acessos no total',price:2000,additional:1,icon:'users'},
  {id:2,name:'Incluir +2 acessos',subtitle:'3 acessos no total',price:5000,additional:2,icon:'users'}
]);
export function money(cents){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);}
export function calculateOrder(planId,extraId=0,deviceId=null,adult=false){
  const plan=typeof planId==='string'&&Object.hasOwn(PLANS,planId)?PLANS[planId]:null;
  const extras=EXTRAS.find(e=>e.id===extraId);
  const device=DEVICES.find(d=>d.id===deviceId);
  if(!plan) throw new Error('Selecione um plano válido.');
  if(!extras) throw new Error('Selecione uma opção de acessos válida.');
  if(deviceId!==null&&!device) throw new Error('Selecione um dispositivo válido.');
  if(typeof adult!=='boolean') throw new Error('Escolha inválida para canais +18.');
  return {plan,extras,device:device??null,adult,total:plan.price+extras.price,accesses:1+extras.additional,pixType:extras.additional>0?'extras':plan.id};
}
export function whatsappMessage(order){
  if(!order.device) throw new Error('Selecione o dispositivo antes de finalizar.');
  return ['Olá, Genuína TV! Quero finalizar meu pedido.','',`Plano: ${order.plan.name}`,`Dispositivo: ${order.device.label}`,`Plano mensal: ${money(order.plan.price)}`,`Acessos adicionais: ${order.extras.additional} (${money(order.extras.price)}/mês)`,`Total de acessos: ${order.accesses}`,`Total mensal / Pix deste pedido: ${money(order.total)}`,`Canais +18: ${order.adult?'solicito ativação e declaro ter 18 anos ou mais':'não habilitar'}`,'','Vou anexar o comprovante nesta conversa para conferência do pagamento e ativação.'].join('\n');
}
export function whatsappUrl(order){return 'https://wa.me/5512997022565?text='+encodeURIComponent(whatsappMessage(order));}
