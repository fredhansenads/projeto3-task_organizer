import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile, readdir, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { root, stateDir, run, docker, supabase, ensureDocker, containers, waitDatabase, withLock } from "./notebook-common.mjs";
import { createBackup, dailyBackup, verifyBackup, restoreEmpty } from "./notebook-backup.mjs";

process.chdir(root);
const origin = "http://127.0.0.1:3000";
const nextCli = join(root, "node_modules/next/dist/bin/next");
const serverState = join(stateDir, "server.json");
const stopRequest = join(stateDir, "stop.json");

async function checkConfig() {
  if (!existsSync(join(root, ".env.local"))) throw Error("Configuração local ausente. Consulte docs/etapa-8-notebook.md.");
  const env = Object.fromEntries((await readFile(join(root, ".env.local"), "utf8")).split(/\r?\n/)
    .filter(line => line.includes("=") && !line.startsWith("#")).map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
  if (env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:54321" || env.APP_URL !== origin)
    throw Error("Este atalho aceita somente o banco e o endereço locais do notebook.");
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "APP_URL"]) {
    if (!env[key] || (process.env[key] && process.env[key] !== env[key]))
      throw Error(`Configuração ausente ou divergente: ${key}.`);
  }
}

async function ensureStack() {
  await ensureDocker();
  let items;
  try { items = await containers(); } catch {}
  if (!items) {
    console.log("Preparando os serviços locais do Supabase...");
    await supabase("start", "-x", "realtime,imgproxy,studio,edge-runtime,logflare,vector,supavisor");
  } else {
    const stopped = items.filter(item => !item.State.Running);
    if (stopped.length) await docker("start", ...stopped.map(item => item.Id));
  }
  await waitDatabase();
  for (let i = 0; i < 90; i++) {
    try {
      const info = JSON.parse(await supabase("status", "-o", "json"));
      const response = await fetch("http://127.0.0.1:54321/auth/v1/health", {
        headers: { apikey: info.PUBLISHABLE_KEY || info.ANON_KEY }, signal: AbortSignal.timeout(3000) });
      if (response.ok) return;
    } catch {}
    await delay(1000);
  }
  throw Error("O serviço de entrada não ficou pronto. Confira o Docker Desktop e tente novamente.");
}

async function openBrowser() {
  if (!process.argv.includes("--no-browser"))
    await run("powershell.exe", ["-NoProfile", "-Command", `Start-Process '${origin}'`]);
}

async function portFree() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", error => error.code === "EADDRINUSE" ? resolve(false) : reject(error));
    server.listen(3000, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function sourceHash() {
  const hash = createHash("sha256");
  async function visit(path, label) {
    const { stat } = await import("node:fs/promises");
    if ((await stat(path)).isDirectory()) {
      for (const name of (await readdir(path)).sort()) await visit(join(path, name), `${label}/${name}`);
    } else hash.update(label).update(await readFile(path));
  }
  for (const name of ["app", "lib", "proxy.ts", "next.config.ts", "postcss.config.mjs", "tsconfig.json", "package.json", "pnpm-lock.yaml", ".env.local"])
    await visit(join(root, name), name);
  hash.update(process.version);
  return hash.digest("hex");
}

async function start() {
  let server;
  const token = randomUUID();
  await withLock(async () => {
    await checkConfig();
    if (!(await portFree())) {
      const page = await fetch(origin, { signal: AbortSignal.timeout(5000) });
      if (!(await page.text()).includes("Minha Rotina Escolar")) throw Error("Outro programa está usando a porta 3000.");
      await ensureStack();
      await dailyBackup();
      console.log("O sistema já está aberto. Use a janela de inicialização existente para encerrar.");
      await openBrowser();
      return;
    }
    await ensureStack();
    await dailyBackup();
    const fingerprint = await sourceHash();
    const marker = join(stateDir, "build.json");
    const buildId = join(root, ".next/BUILD_ID");
    let previous = {};
    try { previous = JSON.parse(await readFile(marker, "utf8")); } catch {}
    if (!existsSync(buildId) || previous.source !== fingerprint || previous.build !== (await readFile(buildId, "utf8")).trim()) {
      console.log("Preparando a aplicação. Esta primeira abertura pode demorar alguns minutos...");
      await run(process.execPath, [nextCli, "build"], { inherit: true });
      await writeFile(marker, JSON.stringify({ source: fingerprint, build: (await readFile(buildId, "utf8")).trim() }));
    }
    server = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", "3000"], {
      cwd: root, windowsHide: true, stdio: "inherit" });
    let failure;
    server.on("error", error => { failure = error; });
    for (let i = 0; i < 90; i++) {
      if (failure || server.exitCode !== null) throw failure || Error("A aplicação encerrou durante a abertura.");
      try {
        const response = await fetch(origin, { signal: AbortSignal.timeout(1000) });
        if (response.ok) {
          console.log(`\nSistema disponível em ${origin}\nMantenha esta janela aberta. Para encerrar, pressione Ctrl+C.\nFaça um backup ao terminar de trabalhar.\n`);
          await openBrowser();
          return;
        }
      } catch {}
      await delay(1000);
    }
    server.kill();
    throw Error("A aplicação não respondeu. Veja as mensagens acima.");
  }).catch(error => { server?.kill(); throw error; });
  if (server) {
    // Own child only: never terminate another Node.js application on this notebook.
    process.removeListener("SIGINT", protectOperation);
    const stop = () => { console.log("Encerrando a aplicação. Os dados permanecem salvos no Docker."); server.kill(); };
    await writeFile(serverState, JSON.stringify({ token, pid: process.pid }));
    let polling = false;
    const control = setInterval(async () => {
      if (polling) return;
      polling = true;
      try {
        const request = JSON.parse(await readFile(stopRequest, "utf8"));
        if (request.token === token && !server.killed) stop();
      } catch {} finally { polling = false; }
    }, 1000);
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.once("close", code => { if (code && !server.killed) reject(Error(`Aplicação encerrou com código ${code}.`)); else resolve(); });
      });
    } finally {
      clearInterval(control);
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      await unlink(serverState).catch(() => {});
      await unlink(stopRequest).catch(() => {});
    }
  }
}

async function stopApplication() {
  await withLock(async () => {
    let state;
    try { state = JSON.parse(await readFile(serverState, "utf8")); }
    catch { console.log("Não há aplicação iniciada por este atalho. Se usou pnpm start, encerre na janela correspondente."); return; }
    await writeFile(stopRequest, JSON.stringify({ token: state.token }));
    for (let i = 0; i < 20; i++) {
      if (!(await portFree())) { await delay(500); continue; }
      console.log("Aplicação encerrada. Banco e anexos permanecem salvos.");
      return;
    }
    throw Error("A janela de inicialização não respondeu. Encerre usando Ctrl+C nessa janela.");
  });
}

function protectOperation() { console.log("Aguarde a preparação ou o backup terminar antes de fechar a janela."); }
process.on("SIGINT", protectOperation);
try {
  const command = process.argv[2];
  if (command === "start") await start();
  else if (command === "stop") await stopApplication();
  else if (["backup", "verify", "restore-empty"].includes(command)) {
    await withLock(async () => {
      await ensureDocker();
      if (command === "backup") { await ensureStack(); await createBackup(); }
      else {
        if (!process.argv[3]) throw Error("Informe a pasta completa da cópia de segurança.");
        if (command === "verify") await verifyBackup(process.argv[3]);
        else await restoreEmpty(process.argv[3]);
      }
    });
  } else throw Error("Use: node scripts/notebook.mjs start | stop | backup | verify <pasta> | restore-empty <pasta>");
} catch (error) {
  console.error(`\nNão foi possível concluir: ${error.message}\nConsulte docs/etapa-8-notebook.md.`);
  process.exitCode = 1;
} finally { process.removeListener("SIGINT", protectOperation); }
