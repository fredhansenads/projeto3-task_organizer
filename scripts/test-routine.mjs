import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localStack,check } from "./local.mjs";

const origin="http://127.0.0.1:3000";
const {url,key,admin}=localStack();
const school=randomUUID(), email="rotina-"+school+"@example.test",password=randomUUID();
const actor=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const browser=await chromium.launch({channel:process.platform==="win32"?"msedge":undefined});
const page=await browser.newPage({viewport:{width:1180,height:820},timezoneId:"UTC"});
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(60000);
const click=name=>page.getByRole("button",{name,exact:true}).click();
const go=name=>page.getByRole("link",{name,exact:true}).first().click();
const label=name=>page.getByLabel(name,{exact:true});
const title="Planejar conselho", event="Reunião do conselho";
async function login() {
  await label("E-mail").fill(email);
  await label("Senha").fill(password);
  await click("Entrar");
  await expect(page.getByRole("heading",{name:"Minha rotina de hoje"})).toBeVisible();
}
let uid;
try {
  uid=check(await admin.auth.admin.createUser({email,password,email_confirm:true})).user.id;
  check(await admin.from("schools").insert({id:school,name:"Escola de teste"}));
  check(await admin.from("school_memberships").insert({school_id:school,user_id:uid}));
  const year=check(await admin.from("academic_years").insert({school_id:school,year:2026}).select("id").single()).id;
  check(await admin.from("classes").insert({school_id:school,year_id:year,name:"6º A"}));
  check(await admin.from("subjects").insert({school_id:school,name:"História"}));
  check(await actor.auth.signInWithPassword({email,password}));
  await page.goto(origin); await login(); await go("Nova tarefa");
  await label("Título").fill(title); await label("Área").selectOption("docencia"); await label("Prioridade").selectOption("alta");
  await label("Situação").selectOption("aguardando"); await label("Data do prazo").fill("2026-05-14");
  await label("Horário opcional").fill("23:59"); await label("Descrição").fill("Preparar a pauta");
  await label("Observações").fill("Levar registros"); await label("Ano letivo").selectOption({label:"2026"});
  await label("Turma").selectOption({label:"6º A"}); await label("Disciplina").selectOption({label:"História"});
  await click("Adicionar etapa"); await label("Título da etapa 1").fill("Separar registros");
  await label("Data do prazo").fill(""); await click("Salvar tarefa");
  await expect(page.getByText("Informe a data do prazo.",{exact:true})).toBeVisible();
  await expect(label("Título")).toHaveValue(title); await label("Data do prazo").fill("2026-05-14");
  await click("Salvar tarefa"); await expect(page.getByRole("heading",{name:title})).toBeVisible();
  const taskId=new URL(page.url()).searchParams.get("id");
  const record=check(await actor.from("tasks").select("*").eq("id",taskId).single());
  assert.equal(new Date(record.due_at).toISOString(),"2026-05-15T02:59:00.000Z");
  assert.equal(record.owner_id,uid);
  const transition={sid:school,tid:taskId,expected:1,operation:"complete",confirmed:false};
  assert.ok((await actor.rpc("task_transition",transition)).error);
  // A falha na última etapa reverte inclusive a edição do título.
  const broken=await actor.rpc("save_task",{sid:school,tid:taskId,expected:1,
    fields:{title:"Atualização incompleta",area:"pessoal",priority:"normal",status:"pendente"},
    steps:[{id:randomUUID(),title:"",done:false}]});
  assert.ok(broken.error);
  await click("Sair"); await login(); await go("Minhas tarefas");
  await label("Buscar tarefa").fill("inexistente"); await expect(page.getByText("Nenhuma tarefa nesta seleção.")).toBeVisible();
  await label("Buscar tarefa").fill("conselho"); await go(title); await go("Editar tarefa e etapas");
  await expect(label("Título")).toHaveValue(title); await expect(label("Horário opcional")).toHaveValue("23:59");
  await expect(label("Título da etapa 1")).toHaveValue("Separar registros");
  await expect(page.getByRole("textbox",{name:"Observações",exact:true})).toHaveValue("Levar registros");
  await expect(label("Disciplina").locator("option:checked")).toHaveText("História");
  await label("Data do prazo").fill("2026-05-15"); await label("Horário opcional").fill("");
  await click("Salvar tarefa"); await expect(page.getByText(/Prazo: 14\/05\/2026 às 23:59 → 15\/05\/2026/)).toBeVisible();
  await label("Observação da conclusão").fill("Pauta pronta");
  await click("Marcar como realizada"); await expect(page.getByRole("button",{name:"Marcar como realizada"})).toBeVisible();
  await page.getByRole("checkbox",{name:/Concluir mesmo/}).check();
  await click("Marcar como realizada"); await expect(page.getByRole("button",{name:"Reabrir tarefa"})).toBeVisible();
  check(await actor.rpc("task_transition",{...transition,expected:2,confirmed:true}));
  const logs=check(await actor.from("audit_events").select("before_data,after_data").eq("record_id",taskId));
  assert.equal(logs.filter(h=>h.after_data.status==="concluida" && h.before_data?.status!=="concluida").length,1);
  await go("Realizadas"); await go(title); await click("Reabrir tarefa");
  await expect(page.getByText(/· Reaberta$/)).toBeVisible(); await expect(page.getByText(/Concluída · Pauta pronta/)).toBeVisible();
  await go("Realizadas"); await expect(page.getByText("Nenhuma tarefa nesta seleção.")).toBeVisible();
  await go("Minhas tarefas"); await go(title); await page.getByText("Arquivamento",{exact:true}).click(); await click("Arquivar tarefa");
  await expect(page.getByRole("button",{name:"Restaurar tarefa"})).toBeVisible();
  await go("Arquivadas"); await go(title); await click("Restaurar tarefa"); await expect(page.getByRole("button",{name:"Marcar como realizada"})).toBeVisible();
  await go("Agenda"); await go("Novo compromisso"); await label("Título").fill(event);
  await label("Início").fill("2026-05-15T23:45"); await label("Término").fill("2026-05-16T00:30"); await label("Observações").fill("Sala 1");
  await click("Salvar compromisso"); await expect(page.getByRole("heading",{name:event})).toBeVisible();
  await go("Agenda"); await label("Ir para a data").fill("2026-05-15");
  await expect(page.getByRole("link",{name:"Prazo · "+title})).toHaveCount(1);
  await expect(page.getByRole("link",{name:"Continua · "+event})).toBeVisible();
  await label("Visualização").selectOption("mes"); await page.setViewportSize({width:390,height:820});
  await go("Prazo · "+title); await expect(page.getByRole("heading",{name:title})).toBeVisible();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log("Tarefas, histórico, confirmação, falha atômica, filtros, agenda e persistência aprovados no navegador.");
} finally {
  await browser.close();
  for(const table of ["task_steps","tasks","events","audit_events","classes","subjects","academic_years","school_memberships"])
    check(await admin.from(table).delete().eq("school_id",school));
  check(await admin.from("schools").delete().eq("id",school));
  if(uid) check(await admin.auth.admin.deleteUser(uid));
}
