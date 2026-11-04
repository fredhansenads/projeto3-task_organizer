import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, open, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { root, project, backupDir, dbName, volumes, run, docker, containers, resume, waitDatabase } from "./notebook-common.mjs";

const date = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const sql = (name, query) => docker("exec", name, "psql", "-X", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-Atc", query);

async function hash(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

// Digest every row of application tables, users and storage metadata, without logging their contents.
async function databaseFingerprint(name) {
  const tables = JSON.parse(await sql(name, `select json_agg(format('%I.%I', schemaname, tablename) order by schemaname, tablename)
    from pg_tables where schemaname in ('public','private','auth','storage','supabase_migrations')`));
  const queries = tables.map(table => `select '${table.replaceAll("'", "''")}' as name,
    count(*) || ':' || md5(coalesce(string_agg(row_to_json(t)::text, E'\\n' order by row_to_json(t)::text),'')) as digest from ${table} t`);
  return JSON.parse(await sql(name, `select json_object_agg(name,digest order by name) from (${queries.join(" union all ")}) fingerprints`));
}

async function outputToFile(args, path) {
  const handle = await open(path, "wx", 0o600);
  try { await run("docker", args, { output: handle.fd }); await handle.sync(); }
  finally { await handle.close(); }
}

async function extract(image, volume, path) {
  const child = spawn("docker", ["run", "--rm", "-i", "--network", "none", "--user", "0", "--entrypoint", "tar",
    "--mount", `type=volume,source=${volume},target=/restore`, image, "-xzf", "-", "-C", "/restore"],
  { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk; });
  const done = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve() : reject(Error(`Extração falhou: ${stderr.slice(-1000)}`)));
  });
  await Promise.all([pipeline(createReadStream(path), child.stdin), done]);
}

async function volumeFingerprint(image, volume) {
  // Fixed command inside an isolated Linux container; never runs against host paths.
  return docker("run", "--rm", "--network", "none", "--user", "0", "--entrypoint", "sh",
    "--mount", `type=volume,source=${volume},target=/source,readonly`, image, "-c",
    "cd /source && find . -type f -exec sha256sum {} + | LC_ALL=C sort");
}

export async function createBackup() {
  const items = await containers();
  const db = items.find(item => item.Name === `/${dbName}`);
  const storage = items.find(item => item.Name === `/supabase_storage_${project}`);
  if (!db || !storage || !db.State.Running) throw Error("Inicie o sistema antes de criar o backup.");
  const mounted = items.flatMap(item => item.Mounts.filter(m => m.Type === "volume").map(m => m.Name));
  if (volumes.some(v => !mounted.includes(v)) || mounted.some(v => !volumes.includes(v)))
    throw Error("As montagens do Supabase mudaram. Revise o backup antes de continuar.");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await mkdir(backupDir, { recursive: true });
  const partial = join(backupDir, `${stamp}.incompleto`);
  const destination = join(backupDir, stamp);
  await mkdir(partial);
  const manifest = { format: 1, project, date: date(), createdAt: new Date().toISOString(),
    codeCommit: await run("git", ["rev-parse", "HEAD"]),
    cliVersion: JSON.parse(await readFile(join(root, "node_modules/supabase/package.json"), "utf8")).version,
    database: { image: db.Image, imageTag: db.Config.Image,
      imageDigests: JSON.parse(await docker("image", "inspect", db.Image))[0].RepoDigests, env: db.Config.Env,
      entrypoint: db.Config.Entrypoint, cmd: db.Config.Cmd, mount: db.Mounts[0].Destination }, files: {}, volumes: [] };
  console.log("Criando backup. Não edite registros nem feche esta janela até terminar.");
  try {
    // Stop all clients first, then dump and cleanly stop PostgreSQL before copying its data directory.
    const clients = items.filter(item => item !== db && item.State.Running);
    if (clients.length) await docker("stop", "--time", "60", ...clients.map(item => item.Id));
    manifest.database.fingerprint = await databaseFingerprint(dbName);
    await outputToFile(["exec", dbName, "pg_dump", "-U", "postgres", "-d", "postgres", "-Fc"], join(partial, "database.dump"));
    await outputToFile(["exec", dbName, "pg_dumpall", "-U", "postgres", "--roles-only"], join(partial, "roles.sql"));
    await docker("stop", "--time", "120", db.Id);
    const stopped = JSON.parse(await docker("inspect", db.Id))[0];
    if (stopped.State.Running || stopped.State.ExitCode !== 0)
      throw Error("O banco não encerrou normalmente; a cópia física foi cancelada.");
    for (const volume of volumes) {
      const file = `${volume}.tar.gz`;
      await outputToFile(["run", "--rm", "--network", "none", "--user", "0", "--entrypoint", "tar",
        "--mount", `type=volume,source=${volume},target=/source,readonly`, db.Image, "-czf", "-", "-C", "/source", "."], join(partial, file));
      const fingerprint = createHash("sha256").update(await volumeFingerprint(db.Image, volume)).digest("hex");
      manifest.volumes.push({ name: volume, file, fingerprint });
    }
    for (const [source, target] of [[".env.local", "app.env"], ["supabase/config.toml", "supabase-config.toml"],
      ["package.json", "package.json"], ["pnpm-lock.yaml", "pnpm-lock.yaml"], [".env.demo.local", "account.json"]]) {
      try { await copyFile(join(root, source), join(partial, target)); }
      catch (error) { if (source !== ".env.demo.local" || error.code !== "ENOENT") throw error; }
    }
    for (const file of await readdir(partial)) manifest.files[file] = await hash(join(partial, file));
    await writeFile(join(partial, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
    await rename(partial, destination);
    console.log(`Backup concluído: ${destination}`);
  } finally {
    // Also resume services after a dump/copy/disk-space failure. Partial folders are never valid backups.
    await resume(items);
  }
  return destination;
}

export async function checkedBackup(folder) {
  const path = resolve(folder);
  if (path.endsWith(".incompleto")) throw Error("Esta cópia está incompleta.");
  const manifest = JSON.parse(await readFile(join(path, "manifest.json"), "utf8"));
  if (manifest.format !== 1 || manifest.project !== project || manifest.volumes.length !== volumes.length)
    throw Error("Formato de backup incompatível.");
  for (const volume of volumes) {
    if (!manifest.volumes.some(v => v.name === volume && v.file === `${volume}.tar.gz`) || !manifest.files[`${volume}.tar.gz`])
      throw Error("O backup não contém todos os volumes esperados.");
  }
  for (const required of ["database.dump", "roles.sql", "app.env", "supabase-config.toml", "package.json", "pnpm-lock.yaml"])
    if (!manifest.files[required]) throw Error(`Arquivo obrigatório ausente: ${required}`);
  for (const [file, digest] of Object.entries(manifest.files)) {
    if (basename(file) !== file || file.includes("\\") || file.includes(":") || !/^[a-f0-9]{64}$/.test(digest)) throw Error("Manifesto inválido.");
    if (await hash(join(path, file)) !== digest) throw Error(`Cópia corrompida ou alterada: ${file}`);
  }
  return { path, manifest };
}

export async function dailyBackup() {
  await mkdir(backupDir, { recursive: true });
  for (const folder of (await readdir(backupDir)).sort().reverse()) {
    if (folder.endsWith(".incompleto")) continue;
    try {
      const candidate = join(backupDir, folder);
      const info = JSON.parse(await readFile(join(candidate, "manifest.json"), "utf8"));
      if (info.date !== date()) continue;
      await checkedBackup(candidate);
      console.log("O backup automático de hoje já está salvo.");
      return;
    } catch {} // An incomplete/corrupt copy cannot satisfy the daily backup requirement.
  }
  await createBackup();
}

export async function verifyBackup(folder) {
  const { path, manifest } = await checkedBackup(folder);
  const image = manifest.database.image;
  await docker("image", "inspect", image); // Exact image, no automatic download or version substitution.
  const prefix = `rotina_verify_${randomUUID().replaceAll("-", "")}`;
  const created = [];
  let containerCreated = false;
  try {
    for (const [index, item] of manifest.volumes.entries()) {
      const volume = `${prefix}_${index}`;
      await docker("volume", "create", "--label", `rotina.verification=${prefix}`, volume);
      created.push(volume);
      await extract(image, volume, join(path, item.file));
      const fingerprint = createHash("sha256").update(await volumeFingerprint(image, volume)).digest("hex");
      if (fingerprint !== item.fingerprint) throw Error("Conteúdo restaurado diferente da cópia original.");
    }
    const dbIndex = manifest.volumes.findIndex(v => v.name === dbName);
    const args = ["create", "--name", prefix, "--label", `rotina.verification=${prefix}`, "--network", "none",
      "--mount", `type=volume,source=${created[dbIndex]},target=${manifest.database.mount}`];
    for (const env of manifest.database.env) args.push("--env", env);
    args.push("--entrypoint", manifest.database.entrypoint[0], image,
      ...manifest.database.entrypoint.slice(1), ...manifest.database.cmd);
    await docker(...args);
    containerCreated = true;
    await docker("start", prefix);
    await waitDatabase(prefix);
    const fingerprint = await databaseFingerprint(prefix);
    if (JSON.stringify(fingerprint) !== JSON.stringify(manifest.database.fingerprint))
      throw Error("O banco restaurado não corresponde aos registros do backup.");
    console.log("Restauração verificada: banco, usuários, metadados e bytes dos anexos conferem. Dados atuais preservados.");
    await writeFile(join(path, "verification.json"), JSON.stringify({ checkedAt: new Date().toISOString(), result: "ok" }, null, 2));
  } finally {
    if (containerCreated) await docker("rm", "-f", prefix);
    for (const volume of created) {
      const [info] = JSON.parse(await docker("volume", "inspect", volume));
      if (info.Labels?.["rotina.verification"] !== prefix || !volume.startsWith(prefix + "_"))
        throw Error("Volume de verificação não reconhecido; limpeza cancelada.");
      await docker("volume", "rm", volume);
    }
  }
}

// Disaster recovery only: refuses to replace any existing data or configuration.
export async function restoreEmpty(folder) {
  const { path, manifest } = await checkedBackup(folder);
  const existing = (await docker("volume", "ls", "--format", "{{.Name}}")).split(/\r?\n/);
  if (volumes.some(v => existing.includes(v))) throw Error("Já existem dados locais. Restauração cancelada; nenhum volume foi substituído.");
  const { existsSync } = await import("node:fs");
  if ([".env.local", ".env.demo.local"].some(file => existsSync(join(root, file))))
    throw Error("Já existe configuração local. Use uma instalação vazia e mantenha a instalação atual intacta.");
  const version = JSON.parse(await readFile(join(root, "node_modules/supabase/package.json"), "utf8")).version;
  if (version !== manifest.cliVersion) throw Error("Instale a versão do Supabase CLI registrada no backup antes de restaurar.");
  if (await hash(join(root, "supabase/config.toml")) !== manifest.files["supabase-config.toml"])
    throw Error("A configuração Supabase difere do backup. Recupere primeiro o código da versão indicada no manifesto.");
  await verifyBackup(folder);
  for (const item of manifest.volumes) {
    await docker("volume", "create", "--label", `com.supabase.cli.project=${project}`, item.name);
    await extract(manifest.database.image, item.name, join(path, item.file));
  }
  // COPYFILE_EXCL prevents replacing credentials created concurrently.
  await copyFile(join(path, "app.env"), join(root, ".env.local"), 1);
  if (manifest.files["account.json"]) await copyFile(join(path, "account.json"), join(root, ".env.demo.local"), 1);
  console.log("Volumes restaurados. Abra Iniciar sistema.cmd e confira a entrada, as tarefas e um anexo.");
}
