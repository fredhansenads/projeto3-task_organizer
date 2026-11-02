import assert from "node:assert/strict";
import test from "node:test";
import {calendarDays,late,localDay} from "../lib/rotina.ts";

test("prazo sem hora vence no fim do dia de São Paulo",()=>{
  const task={due_date:"2026-05-14",due_at:null,completed_at:null};
  assert.equal(late(task,"2026-05-15T02:59:59.999Z"),false);
  assert.equal(late(task,"2026-05-15T03:00:00Z"),true);
  assert.equal(late({...task,completed_at:"2026-05-15T02:59:59Z"},"2026-05-16T12:00:00Z"),false);
  assert.equal(late({...task,due_date:null},"2026-05-16T12:00:00Z"),false);
});
test("prazo com horário e agenda preservam o dia local",()=>{
  const task={due_date:null,due_at:"2026-05-15T02:59:00Z",completed_at:null};
  assert.equal(late(task,task.due_at),false);
  assert.equal(late(task,"2026-05-15T02:59:00.001Z"),true);
  assert.equal(localDay(task.due_at),"2026-05-14");
  assert.deepEqual(calendarDays("2026-01-01",false).filter((_,i)=>i===0||i===6),["2025-12-29","2026-01-04"]);
  assert.ok(calendarDays("2028-02-10",true).includes("2028-02-29"));
});
