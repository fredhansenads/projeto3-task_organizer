import { spawn } from "node:child_process";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const project = "minha-rotina-escolar";
export const stateDir = join(root, ".notebook");
export const backupDir = join(root, "backups");
export const cli = join(root, "node_modules/supabase/dist/supabase.js");
export const dbName = `supabase_db_${project}`;
export const volumes = [dbName, `supabase_storage_${project}`];

// No shell interpolation: paths, including spaces, remain individual arguments.
export function run(executable, args, { inherit = false, input, output, env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: root, windowsHide: true, env: env ?? process.env,
      stdio: inherit ? "inherit" : [input === undefined ? "ignore" : "pipe", output ?? "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout?.on("data", chunk => { stdout += chunk; });
    child.stderr?.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(stdout.trim()) : reject(new Error(
      `${executable} falhou (${code}). ${stderr.slice(-2000)}`)));
    if (input !== undefined) {
      child.stdin.on("error", () => {}); // Exit status remains authoritative on EPIPE.
      child.stdin.end(input);
    }
  });
}
export const docker = (...args) => run("docker", args);
export const supabase = (...args) => run(process.execPath, [cli, ...args]);

export async function ensureDocker() {
  try { await docker("info", "--format", "{{.OSType}}"); return; } catch {}
  console.log("Iniciando o Docker Desktop. Aguarde...");
  const candidates = [
    join(process.env.LOCALAPPDATA || "", "Programs/DockerDesktop/Docker Desktop.exe"),
    join(process.env.ProgramFiles || "C:/Program Files", "Docker/Docker/Docker Desktop.exe"),
  ];
  const { existsSync } = await import("node:fs");
  const executable = candidates.find(path => existsSync(path));
  if (!executable) throw Error("Abra o Docker Desktop e tente novamente. Ele deve usar contêineres Linux.");
  // Windows UI launch is hidden; no console is created.
  await run("powershell.exe", ["-NoProfile", "-Command",
    "Start-Process -FilePath $env:ROTINA_DOCKER_EXE -WindowStyle Hidden"],
    { env: { ...process.env, ROTINA_DOCKER_EXE: executable } });
  for (let i = 0; i < 90; i++) {
    try { await docker("info", "--format", "{{.OSType}}"); return; } catch {}
    await delay(2000);
  }
  throw Error("O Docker não ficou disponível. Confira a janela do Docker Desktop e tente novamente.");
}

export async function containers() {
  const ids = (await docker("ps", "-aq", "--filter", `label=com.supabase.cli.project=${project}`)).split(/\s+/).filter(Boolean);
  if (!ids.length) throw Error("Supabase local não encontrado. Inicie o sistema antes de fazer backup.");
  const items = JSON.parse(await docker("inspect", ...ids));
  for (const item of items) {
    if (item.Config.Labels?.["com.supabase.cli.project"] !== project || !item.Name.endsWith(`_${project}`))
      throw Error("Serviço fora do projeto local; operação cancelada.");
  }
  return items;
}

export async function withLock(action) {
  await mkdir(stateDir, { recursive: true });
  const path = join(stateDir, "operation.lock");
  let handle;
  try { handle = await open(path, "wx"); }
  catch (error) {
    if (error.code !== "EEXIST") throw error;
    const owner = Number(await readFile(path, "utf8"));
    try { process.kill(owner, 0); }
    catch (error) {
      if (error.code === "ESRCH") { await unlink(path); return withLock(action); }
    }
    throw Error("Já existe uma inicialização ou backup em andamento. Aguarde terminar.");
  }
  try { await handle.writeFile(String(process.pid)); return await action(); }
  finally { await handle.close(); await unlink(path); }
}

export async function waitDatabase(name = dbName) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { await docker("exec", name, "pg_isready", "-U", "postgres", "-d", "postgres"); return; } catch {}
    await delay(1000);
  }
  throw Error("O banco não ficou pronto. Confira o Docker Desktop.");
}

export async function resume(items) {
  const running = items.filter(item => item.State.Running);
  const db = running.find(item => item.Name === `/${dbName}`);
  if (db) { await docker("start", db.Id); await waitDatabase(); }
  const rest = running.filter(item => item !== db);
  if (rest.length) await docker("start", ...rest.map(item => item.Id));
}
