import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFile,mkdir} from "node:fs/promises";
import {chromium,expect} from "@playwright/test";
import {createClient} from "@supabase/supabase-js";
import {localStack,check} from "./local.mjs";

const {url,key,admin}=localStack();
const school=randomUUID(),password=randomUUID(),email="relatorios-"+school+"@example.test";
const actor=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const browser=await chromium.launch({channel:process.platform==="win32"?"msedge":undefined});
const page=await browser.newPage({viewport:{width:1200,height:800},timezoneId:"UTC"});
const label=name=>page.getByLabel(name,{exact:true});
const button=name=>page.getByRole("button",{name,exact:true});
const metric=(name,value)=>expect(page.locator(".report-metrics div").filter({has:page.getByText(name,{exact:true})}).locator("dd")).toHaveText(String(value));
const users=[];
const op=async(name,d)=>check(await actor.rpc("material_command",{sid:school,token:randomUUID(),op:name,d}));
const task=async(owner,title)=>check(await admin.from("tasks").insert({school_id:school,owner_id:owner,title,area:"docencia"}).select("id").single()).id;
const change=async(id,fields)=>check(await admin.from("tasks").update(fields).eq("school_id",school).eq("id",id));
const csv=async()=>{
  const wait=page.waitForEvent("download");await button("Exportar CSV").click();
  const file=await wait;return readFile(await file.path(),"utf8");
};
const pupil='=A1;"Ana"';
try {
  for(const address of [email,"colega-"+school+"@example.test"]) users.push(check(await admin.auth.admin.createUser({email:address,password,email_confirm:true})).user.id);
  check(await admin.from("schools").insert({id:school,name:"Escola do relatório"}));
  check(await admin.from("school_memberships").insert(users.map(id=>({school_id:school,user_id:id}))));
  check(await actor.auth.signInWithPassword({email,password}));
  const year=await op("year",{year:2020});
  const ids=await Promise.all([pupil,"Bruno","Carla"].map(name=>op("teacher",{name})));
  await op("request",{title:"Planejamento",period:"Março",type:"Plano",year,date:"2020-03-15",ids});
  const obligations=check(await actor.from("delivery_summary").select("id,teacher_id").eq("school_id",school));
  const obligation=obligations.find(r=>r.teacher_id===ids[0]).id;
  await op("receive",{id:obligation,revision:1,channel:"papel",received:"2020-03-16T09:00"});
  await op("adjust",{id:obligation,revision:2,reason:"Revisar",correction:"2020-03-18"});
  await op("receive",{id:obligation,revision:3,channel:"email",received:"2020-03-17T09:00"});
  await op("approve",{id:obligation,revision:4});
  await op("exempt",{id:obligations.find(r=>r.teacher_id===ids[2]).id,revision:1,reason:"Licença"});
  const done=await task(users[0],"Revisar pauta"),reopened=await task(users[0],"Tarefa reaberta"),secret=await task(users[1],"Privada do colega");
  for(const id of [done,reopened,secret]) await change(id,{status:"concluida",completed_at:"2020-04-01T02:59:00Z",year_id:year});
  await change(reopened,{status:"pendente",completed_at:null});
  assert.equal(check(await actor.from("task_activity_report").select("id").eq("task_id",secret)).length,0);

  await page.goto("http://127.0.0.1:3000");await label("E-mail").fill(email);await label("Senha").fill(password);await button("Entrar").click();
  await metric("Minhas tarefas realizadas",1);await metric("Materiais exigidos",2);await metric("Recebidos",1);await metric("Conferidos",1);await metric("Taxa de recebimento","50%");
  await page.getByRole("link",{name:"Relatórios",exact:true}).click();
  await metric("Exigidos",2);await metric("Pendentes",1);await metric("Dispensados",1);await expect(page.locator("tbody tr")).toHaveCount(3);
  if(process.env.REPORT_PREVIEW==="1") {
    await mkdir(".artifacts",{recursive:true});
    await page.locator(".report").screenshot({path:".artifacts/relatorio-etapa-6.jpg",type:"jpeg",quality:82});
    await page.setViewportSize({width:390,height:820});
    await page.screenshot({path:".artifacts/relatorio-celular-etapa-6.jpg",type:"jpeg",quality:82});
    await page.setViewportSize({width:1200,height:800});
  }
  await page.getByText("Mais filtros",{exact:true}).click();await label("Professor").selectOption(ids[0]);
  await metric("Recebidos",1);await metric("Taxa de recebimento","100%");await expect(page.locator("tbody tr")).toHaveCount(1);
  const exported=await csv();
  assert.ok(exported.startsWith("\uFEFF"));assert.ok(exported.includes('"Recebidos";"1"'));
  assert.ok(exported.includes('"\'=A1;""Ana"""'));assert.ok(exported.includes("Professor: =A1;"));assert.ok(!exported.includes("Bruno"));
  await page.evaluate(()=>{window.print=()=>{document.body.dataset.printCalled="yes";};});
  await button("Imprimir / salvar PDF").click();assert.equal(await page.locator("body").getAttribute("data-print-called"),"yes");
  await page.emulateMedia({media:"print"});await expect(button("Exportar CSV")).toBeHidden();await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByText(/Professor: =A1;/)).toBeVisible();const pdf=await page.pdf({preferCSSPageSize:true});assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
  await page.emulateMedia({media:"screen"});await label("Professor").selectOption(ids[2]);await metric("Exigidos",0);await metric("Taxa de recebimento","Não se aplica");
  await label("Tipo de relatório").selectOption("realizadas");await label("De").fill("2020-03-31");await label("Até").fill("2020-03-31");
  await metric("Realizadas",1);await expect(page.getByRole("rowheader",{name:"Revisar pauta"})).toBeVisible();
  await label("De").fill("2020-04-01");await expect(button("Exportar CSV")).toBeDisabled();await expect(page.getByRole("alert").filter({hasText:"data final"})).toBeVisible();
  await label("Até").fill("2020-04-01");await metric("Realizadas",0);
  await label("Tipo de relatório").selectOption("historico");await label("Ação").selectOption("Reabertura");await metric("Eventos",1);await expect(page.getByRole("rowheader",{name:"Tarefa reaberta"})).toBeVisible();
  await label("Ação").selectOption("Conclusão");await metric("Eventos",2);assert.ok(!(await csv()).includes("Privada do colega"));

  await page.setViewportSize({width:390,height:820});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await button("Menu da escola").focus();await page.keyboard.press("Enter");await expect(button("Menu da escola")).toHaveAttribute("aria-expanded","true");
  await page.keyboard.press("Tab");await expect(page.getByRole("link",{name:"Início",exact:true})).toBeFocused();
  await page.keyboard.press("Enter");await expect(page.getByRole("heading",{name:"Minha rotina de hoje"})).toBeVisible();
  await page.getByRole("link",{name:"Nova tarefa",exact:true}).click();await label("Título").fill("Reunião após falha");
  const block=route=>route.request().method()==="POST"?route.abort("connectionfailed"):route.continue();
  await page.route("**/painel**",block);await button("Salvar tarefa").click();
  await expect(page.getByText(/A conexão falhou/)).toBeVisible();await expect(label("Título")).toHaveValue("Reunião após falha");
  assert.equal(check(await actor.from("tasks").select("id").eq("title","Reunião após falha")).length,0);
  await page.unroute("**/painel**",block);await button("Salvar tarefa").click();await expect(page.getByRole("heading",{name:"Reunião após falha"})).toBeVisible();
  console.log("Painel, filtros, histórico privado, CSV, PDF, teclado, celular e recuperação de falha aprovados.");
} finally {
  await browser.close();
  for(const table of ["tasks","receipt_versions","delivery_obligations","material_requests","teachers","academic_years","audit_events","school_memberships"])
    check(await admin.from(table).delete().eq("school_id",school));
  check(await admin.from("schools").delete().eq("id",school));
  for(const id of users) check(await admin.auth.admin.deleteUser(id));
}
