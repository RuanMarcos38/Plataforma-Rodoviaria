(() => {
  const roles = {
    PLATFORM_ADMIN:{label:'Administrador master',permissions:['*']},
    CARRIER_MANAGER:{label:'Transportadora',permissions:['dashboard:read','freight:create','freight:read','freight:negotiate','contract:create','trip:read','trip:advance','tracking:write','driver:read','driver:create','fiscal:read','fiscal:write','finance:read','finance:settle','incident:create','brand:update']},
    SHIPPER_OPERATOR:{label:'Embarcador',permissions:['dashboard:read','freight:create','freight:read','freight:negotiate','contract:create','trip:read','fiscal:read','finance:read']},
    DRIVER_TAC:{label:'Caminhoneiro TAC',permissions:['dashboard:read','freight:read','offer:create','trip:read','trip:advance','tracking:write','incident:create']},
    CUSTOMER_VIEWER:{label:'Cliente final',permissions:['dashboard:read','trip:read','fiscal:read']}
  };
  const tenants=[
    {id:'tenant-rodonorte',name:'RodoNorte Transportes',segment:'Transportadora',city:'Campinas',uf:'SP',brand:{appName:'R2R Logística',primaryColor:'#0f5f63',accentColor:'#f97316'}},
    {id:'tenant-agrovale',name:'Agrovale Alimentos',segment:'Embarcador',city:'Ribeirão Preto',uf:'SP',brand:{appName:'R2R Logística',primaryColor:'#124559',accentColor:'#f59e0b'}}
  ];
  const freights=[
    {id:'FRT-2408-001',tenantId:'tenant-rodonorte',shipper:'AgroVale Alimentos',origin:{city:'Ribeirão Preto',uf:'SP'},destination:{city:'Contagem',uf:'MG'},cargo:'Alimentos secos paletizados',weightKg:18700,volumeM3:62,cargoValue:185000,requiredVehicle:'truck',requiredBody:'bau',axles:4,distanceKm:545,tolls:428,pickupWindow:'Hoje, 14:00-17:00',deliveryEta:'Amanhã, 09:30',status:'MATCHING',riskScore:34,priority:'alta',returnOpportunity:true,price:6900,requirements:['RNTRC ativo','CRLV válido','Seguro de carga','Rastreador online'],estimate:{fuel:1178,maintenance:610,insurance:740,tolls:428,subtotal:3244,suggestedPrice:3828,costPerKm:5.95}},
    {id:'FRT-2408-002',tenantId:'tenant-rodonorte',shipper:'MetalSul Indústria',origin:{city:'Joinville',uf:'SC'},destination:{city:'Guarulhos',uf:'SP'},cargo:'Peças automotivas',weightKg:9200,volumeM3:39,cargoValue:310000,requiredVehicle:'toco',requiredBody:'sider',axles:3,distanceKm:523,tolls:312,pickupWindow:'Amanhã, 08:00-10:00',deliveryEta:'Amanhã, 21:00',status:'NEGOTIATING',riskScore:46,priority:'media',returnOpportunity:false,price:5800,requirements:['Seguro RCTR-C','Ajudante na descarga','Baixa avaria'],estimate:{fuel:1130,maintenance:586,insurance:1240,tolls:312,subtotal:3484,suggestedPrice:4111,costPerKm:6.66}},
    {id:'FRT-2408-003',tenantId:'tenant-rodonorte',shipper:'FrioBrasil',origin:{city:'Itajaí',uf:'SC'},destination:{city:'Curitiba',uf:'PR'},cargo:'Carga refrigerada',weightKg:12800,volumeM3:48,cargoValue:268000,requiredVehicle:'carreta',requiredBody:'refrigerado',axles:6,distanceKm:218,tolls:167,pickupWindow:'Hoje, 19:00-22:00',deliveryEta:'Amanhã, 06:40',status:'PUBLISHED',riskScore:59,priority:'alta',returnOpportunity:true,price:4400,requirements:['Temperatura monitorada','Rastreador','Comprovante ePOD'],estimate:{fuel:471,maintenance:244,insurance:1072,tolls:167,subtotal:2386,suggestedPrice:2815,costPerKm:10.94}},
    {id:'FRT-2408-004',tenantId:'tenant-agrovale',shipper:'Agrovale Alimentos',origin:{city:'Uberaba',uf:'MG'},destination:{city:'Santos',uf:'SP'},cargo:'Insumos agrícolas',weightKg:22400,volumeM3:70,cargoValue:420000,requiredVehicle:'carreta',requiredBody:'graneleiro',axles:6,distanceKm:590,tolls:490,pickupWindow:'Sexta, 07:00-12:00',deliveryEta:'Sábado, 18:00',status:'PUBLISHED',riskScore:28,priority:'media',returnOpportunity:true,price:7300,requirements:['MDF-e','CIOT','Vale-pedágio'],estimate:{fuel:1275,maintenance:661,insurance:1680,tolls:490,subtotal:4538,suggestedPrice:5355,costPerKm:7.69}}
  ];
  const drivers=[
    {id:'DRV-101',tenantId:'tenant-rodonorte',name:'Carlos Henrique',phone:'+55 19 90000-1001',city:'Sertãozinho',uf:'SP',rating:4.9,distanceToPickupKm:18,available:true,rntrcStatus:'active',documentsStatus:'valid',riskScore:18,vehiclePlate:'R2R1A24',vehicleTypes:['truck','carreta'],bodyTypes:['bau','sider'],previousRoutes:['MG','GO','SP'],returnInterest:true,lastProofOfLife:'2026-08-28 07:42'},
    {id:'DRV-102',tenantId:'tenant-rodonorte',name:'Mariana Lopes',phone:'+55 47 90000-2202',city:'Blumenau',uf:'SC',rating:4.7,distanceToPickupKm:42,available:true,rntrcStatus:'active',documentsStatus:'valid',riskScore:24,vehiclePlate:'MLO8B12',vehicleTypes:['toco','truck'],bodyTypes:['sider','bau'],previousRoutes:['SP','PR','SC'],returnInterest:false,lastProofOfLife:'2026-08-28 09:10'},
    {id:'DRV-103',tenantId:'tenant-rodonorte',name:'João Batista',phone:'+55 11 90000-3303',city:'Osasco',uf:'SP',rating:4.6,distanceToPickupKm:74,available:false,rntrcStatus:'active',documentsStatus:'review',riskScore:52,vehiclePlate:'JBT7C90',vehicleTypes:['carreta'],bodyTypes:['refrigerado','bau'],previousRoutes:['PR','RJ','MG'],returnInterest:true,lastProofOfLife:'2026-08-27 18:11'},
    {id:'DRV-201',tenantId:'tenant-agrovale',name:'Paulo Andrade',phone:'+55 34 90000-4404',city:'Uberlândia',uf:'MG',rating:4.8,distanceToPickupKm:38,available:true,rntrcStatus:'active',documentsStatus:'valid',riskScore:20,vehiclePlate:'PAA3D10',vehicleTypes:['carreta'],bodyTypes:['graneleiro','bau'],previousRoutes:['SP','MG','GO'],returnInterest:true,lastProofOfLife:'2026-08-28 08:22'}
  ];
  const trips=[
    {id:'TRP-9001',tenantId:'tenant-rodonorte',freightId:'FRT-2408-001',driverId:'DRV-101',status:'IN_TRANSIT',vehiclePlate:'R2R1A24',route:'Ribeirão Preto/SP → Contagem/MG',eta:'2026-08-29 09:30',progress:58,alerts:[],timeline:[{at:'08:00',status:'PUBLISHED',text:'Frete publicado'},{at:'08:05',status:'MATCHING',text:'Motorista recomendado'},{at:'08:10',status:'ACCEPTED',text:'Contratação aceita'},{at:'08:18',status:'DOCUMENTATION',text:'CIOT preparado'},{at:'09:40',status:'IN_TRANSIT',text:'Carga em trânsito'}],lastPing:{city:'Franca',uf:'SP',speed:72,at:'10:48'}},
    {id:'TRP-9002',tenantId:'tenant-rodonorte',freightId:'FRT-2408-002',driverId:'DRV-102',status:'DOCUMENTATION',vehiclePlate:'MLO8B12',route:'Joinville/SC → Guarulhos/SP',eta:'2026-08-29 21:00',progress:20,alerts:[{type:'document',text:'MDF-e aguardando autorização'}],timeline:[{at:'10:05',status:'PUBLISHED',text:'Carga publicada'},{at:'10:22',status:'NEGOTIATING',text:'Proposta recebida'},{at:'10:31',status:'DOCUMENTATION',text:'Documentos em emissão'}],lastPing:{city:'Blumenau',uf:'SC',speed:0,at:'10:50'}},
    {id:'TRP-9101',tenantId:'tenant-agrovale',freightId:'FRT-2408-004',driverId:'DRV-201',status:'SCHEDULED_PICKUP',vehiclePlate:'PAA3D10',route:'Uberaba/MG → Santos/SP',eta:'2026-08-30 18:00',progress:8,alerts:[],timeline:[{at:'07:30',status:'PUBLISHED',text:'Solicitação criada'},{at:'08:12',status:'ACCEPTED',text:'Transportadora contratada'},{at:'09:00',status:'SCHEDULED_PICKUP',text:'Coleta agendada'}],lastPing:{city:'Uberlândia',uf:'MG',speed:0,at:'10:52'}}
  ];
  const fiscal=[
    {id:'DOC-CTE-001',tenantId:'tenant-rodonorte',tripId:'TRP-9001',type:'CT-e',key:'35260800000000000000570010000000011000000010',status:'authorized',environment:'homologacao',protocol:'135260000000101'},
    {id:'DOC-MDFE-002',tenantId:'tenant-rodonorte',tripId:'TRP-9002',type:'MDF-e',key:'42260800000000000000580010000000022000000020',status:'pending',environment:'homologacao',protocol:''},
    {id:'DOC-CIOT-004',tenantId:'tenant-agrovale',tripId:'TRP-9101',type:'CIOT',key:'CIOT-2026-000004',status:'authorized',environment:'homologacao',protocol:'CIOT-HML-4004'}
  ];
  const finance=[
    {id:'PAY-001',tenantId:'tenant-rodonorte',tripId:'TRP-9001',method:'PIX',amount:6900,status:'escrow',idempotencyKey:'seed-pay-001'},
    {id:'PAY-002',tenantId:'tenant-rodonorte',tripId:'TRP-9002',method:'boleto',amount:5800,status:'pending',idempotencyKey:'seed-pay-002'},
    {id:'PAY-003',tenantId:'tenant-agrovale',tripId:'TRP-9101',method:'PIX',amount:7300,status:'paid',idempotencyKey:'seed-pay-003'}
  ];
  const offers=[],contracts=[],incidents=[];
  const audit=[{id:'AUD-001',tenantId:'tenant-rodonorte',actor:'system',action:'bootstrap',entity:'workspace',at:new Date().toISOString()},{id:'AUD-002',tenantId:'tenant-agrovale',actor:'system',action:'bootstrap',entity:'workspace',at:new Date().toISOString()}];
  const statusLabels={DRAFT:'Rascunho',PUBLISHED:'Publicado',MATCHING:'Buscando motorista',NEGOTIATING:'Em negociação',ACCEPTED:'Aceito',DOCUMENTATION:'Documentação',SCHEDULED_PICKUP:'Coleta agendada',EN_ROUTE_PICKUP:'Indo para coleta',AT_PICKUP:'Na coleta',LOADING:'Carregando',IN_TRANSIT:'Em trânsito',AT_DESTINATION:'No destino',UNLOADING:'Descarregando',DELIVERED:'Entregue',DOCUMENT_PENDING:'Documento pendente',SETTLEMENT_PENDING:'Pagamento pendente',CLOSED:'Encerrado',CANCELLED:'Cancelado',INCIDENT:'Ocorrência'};
  const transitions={DOCUMENTATION:['SCHEDULED_PICKUP','DOCUMENT_PENDING','CANCELLED'],SCHEDULED_PICKUP:['EN_ROUTE_PICKUP','CANCELLED'],EN_ROUTE_PICKUP:['AT_PICKUP','INCIDENT'],AT_PICKUP:['LOADING','INCIDENT'],LOADING:['IN_TRANSIT','INCIDENT'],IN_TRANSIT:['AT_DESTINATION','INCIDENT'],AT_DESTINATION:['UNLOADING','INCIDENT'],UNLOADING:['DELIVERED','INCIDENT'],DELIVERED:['SETTLEMENT_PENDING'],SETTLEMENT_PENDING:['CLOSED'],INCIDENT:['IN_TRANSIT','CANCELLED','DOCUMENT_PENDING']};
  const json=(payload,status=200)=>Promise.resolve(new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json'}}));
  const now=()=>new Date().toISOString();
  const time=()=>new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    const raw=typeof input==='string'?input:input.url;
    if(!raw.startsWith('/api/')) return originalFetch(input,init);
    const url=new URL(raw,location.origin);
    const headers=new Headers(init.headers||{});
    const tenantId=headers.get('x-tenant-id')||'tenant-rodonorte';
    const tenant=tenants.find(t=>t.id===tenantId)||tenants[0];
    const method=(init.method||'GET').toUpperCase();
    let body={}; try{body=init.body?JSON.parse(init.body):{}}catch{}
    const own=(list)=>list.filter(x=>x.tenantId===tenant.id);
    if(url.pathname==='/api/health') return json({ok:true,service:'plataforma-rodoviaria-preview',environment:'preview',persistence:'browser-session'});
    if(url.pathname==='/api/bootstrap') return json({tenant,tenants,roles,statusLabels,transitions,brand:tenant.brand,generatedAt:now()});
    if(url.pathname==='/api/dashboard'){
      const tf=own(freights),tt=own(trips),tp=own(finance),td=own(drivers); const revenue=tp.reduce((s,p)=>s+p.amount,0),paid=tp.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
      return json({openFreights:tf.filter(f=>['PUBLISHED','MATCHING','NEGOTIATING'].includes(f.status)).length,activeTrips:tt.filter(t=>['EN_ROUTE_PICKUP','AT_PICKUP','LOADING','IN_TRANSIT','AT_DESTINATION','UNLOADING'].includes(t.status)).length,delayedTrips:0,driversAvailable:td.filter(d=>d.available).length,fiscalPending:own(fiscal).filter(d=>d.status!=='authorized').length,revenue,paid,receivable:revenue-paid,otif:100,emptyKmReduced:1260,fleetOccupancy:78});
    }
    if(url.pathname==='/api/freights'&&method==='GET'){
      const q=(url.searchParams.get('q')||'').toLowerCase(),status=url.searchParams.get('status')||'all',priority=url.searchParams.get('priority')||'all';
      return json(own(freights).filter(f=>(status==='all'||f.status===status)&&(priority==='all'||f.priority===priority)&&(!q||JSON.stringify(f).toLowerCase().includes(q))));
    }
    if(url.pathname==='/api/freights'&&method==='POST'){
      const id=`FRT-PREV-${String(freights.length+1).padStart(3,'0')}`,distanceKm=Number(body.distanceKm||420),tolls=Number(body.tolls||280),cargoValue=Number(body.cargoValue||0),subtotal=Math.round(distanceKm*4.7+tolls+cargoValue*.004);
      const f={id,tenantId:tenant.id,shipper:body.shipper,origin:{city:body.originCity,uf:String(body.originUf||'').toUpperCase()},destination:{city:body.destinationCity,uf:String(body.destinationUf||'').toUpperCase()},cargo:body.cargo,weightKg:Number(body.weightKg),volumeM3:Number(body.volumeM3||0),cargoValue,requiredVehicle:body.requiredVehicle||'truck',requiredBody:body.requiredBody||'bau',axles:4,distanceKm,tolls,pickupWindow:'A definir',deliveryEta:'A calcular',status:'PUBLISHED',riskScore:32,priority:'media',returnOpportunity:false,price:Math.round(subtotal*1.18),requirements:['RNTRC ativo','Documentos válidos','Rastreamento'],estimate:{subtotal,suggestedPrice:Math.round(subtotal*1.18),costPerKm:Number((subtotal/distanceKm).toFixed(2))}};
      freights.unshift(f); audit.unshift({id:`AUD-${audit.length+1}`,tenantId:tenant.id,actor:'preview',action:'freight:create',entity:id,at:now()}); return json(f,201);
    }
    if(url.pathname==='/api/drivers'&&method==='GET'){
      const list=own(drivers).map(d=>({...d,matchScore:Math.max(50,96-Math.round(d.distanceToPickupKm/3)-Math.round(d.riskScore/10))})).sort((a,b)=>b.matchScore-a.matchScore); return json(list);
    }
    if(url.pathname==='/api/drivers'&&method==='POST'){
      const d={id:`DRV-${drivers.length+101}`,tenantId:tenant.id,name:body.name,phone:body.phone||'',city:body.city,uf:String(body.uf||'').toUpperCase(),rating:4.6,distanceToPickupKm:Number(body.distanceToPickupKm||30),available:true,rntrcStatus:'active',documentsStatus:'valid',riskScore:24,vehiclePlate:String(body.vehiclePlate||'').toUpperCase(),vehicleTypes:body.vehicleTypes||['truck'],bodyTypes:body.bodyTypes||['bau'],previousRoutes:body.previousRoutes||['SP'],returnInterest:true,lastProofOfLife:`${now().slice(0,10)} ${time()}`}; drivers.unshift(d); return json(d,201);
    }
    if(url.pathname==='/api/offers'&&method==='GET') return json(own(offers));
    if(url.pathname==='/api/offers'&&method==='POST'){
      const d=drivers.find(x=>x.id===body.driverId),f=freights.find(x=>x.id===body.freightId); const o={id:`OFR-${String(offers.length+1).padStart(4,'0')}`,tenantId:tenant.id,freightId:f.id,driverId:d.id,driverName:d.name,amount:Number(body.amount||f.price),status:'sent',message:body.message||'Proposta enviada pela torre de controle',createdAt:now()}; offers.unshift(o); f.status='NEGOTIATING'; return json(o,201);
    }
    if(url.pathname==='/api/contracts'&&method==='GET') return json(own(contracts));
    if(url.pathname==='/api/contracts'&&method==='POST'){
      const o=offers.find(x=>x.id===body.offerId),f=freights.find(x=>x.id===o.freightId),d=drivers.find(x=>x.id===o.driverId); o.status='accepted'; f.status='ACCEPTED'; const c={id:`CTR-${String(contracts.length+1).padStart(4,'0')}`,tenantId:tenant.id,freightId:f.id,offerId:o.id,driverId:d.id,amount:o.amount,status:'active',createdAt:now()}; const t={id:`TRP-${String(trips.length+9001).padStart(4,'0')}`,tenantId:tenant.id,freightId:f.id,driverId:d.id,contractId:c.id,status:'DOCUMENTATION',vehiclePlate:d.vehiclePlate,route:`${f.origin.city}/${f.origin.uf} → ${f.destination.city}/${f.destination.uf}`,eta:f.deliveryEta,progress:12,alerts:[{type:'document',text:'Preparar CIOT, CT-e e MDF-e em homologação'}],timeline:[{at:time(),status:'ACCEPTED',text:'Proposta aceita'},{at:time(),status:'DOCUMENTATION',text:'Fluxo documental iniciado'}],lastPing:{city:f.origin.city,uf:f.origin.uf,speed:0,at:time()}}; contracts.unshift(c); trips.unshift(t); return json({contract:c,trip:t,payment:null},201);
    }
    if(url.pathname==='/api/trips'&&method==='GET') return json(own(trips));
    const adv=url.pathname.match(/^\/api\/trips\/([^/]+)\/advance$/); if(adv&&method==='POST'){const t=trips.find(x=>x.id===adv[1]); t.status=body.targetStatus; t.progress=Math.min(100,t.progress+12); t.timeline.push({at:time(),status:t.status,text:body.note||t.status}); return json(t);}
    if(url.pathname==='/api/tracking/ping'&&method==='POST'){const t=trips.find(x=>x.id===body.tripId); t.lastPing={city:body.city||t.lastPing.city,uf:body.uf||t.lastPing.uf,speed:Number(body.speed||0),at:time()}; t.progress=Math.min(100,Number(body.progress||t.progress)); return json(t);}
    if(url.pathname==='/api/fiscal'&&method==='GET') return json(own(fiscal));
    if(url.pathname==='/api/fiscal/authorize'&&method==='POST'){const d=fiscal.find(x=>x.id===body.documentId); d.status='authorized'; d.protocol=`HML-${Date.now()}`; return json(d);}
    if(url.pathname==='/api/finance'&&method==='GET') return json(own(finance));
    const settle=url.pathname.match(/^\/api\/payments\/([^/]+)\/settle$/); if(settle&&method==='POST'){const p=finance.find(x=>x.id===settle[1]); p.status='paid'; p.settledAt=now(); return json(p);}
    if(url.pathname==='/api/risk'&&method==='GET') return json(own(drivers).map(d=>({id:`RSK-${d.id}`,driverId:d.id,driverName:d.name,score:d.riskScore,level:d.riskScore>=50?'medio':'baixo',findings:[d.documentsStatus==='valid'?'Documentos válidos':'Documentos em revisão',d.rntrcStatus==='active'?'RNTRC ativo':'RNTRC pendente',d.available?'Disponível':'Em viagem']})));
    if(url.pathname==='/api/incidents'&&method==='GET') return json(own(incidents));
    if(url.pathname==='/api/incidents'&&method==='POST'){const i={id:`INC-${String(incidents.length+1).padStart(4,'0')}`,tenantId:tenant.id,tripId:body.tripId,type:body.type||'operacional',severity:'alta',message:body.message||'Ocorrência registrada pela torre',createdAt:now()}; incidents.unshift(i); const t=trips.find(x=>x.id===i.tripId); if(t){t.alerts.unshift({type:'incident',text:i.message});} return json(i,201);}
    if(url.pathname==='/api/brand'&&method==='POST'){tenant.brand={...tenant.brand,...body}; return json(tenant.brand);}
    if(url.pathname==='/api/audit'&&method==='GET') return json(own(audit).slice(0,25));
    return json({error:'Rota de preview não encontrada'},404);
  };
})();