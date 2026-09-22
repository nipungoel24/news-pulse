import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { IngestJob } from "@backend/types.ts";
import type { PipelineDocument } from "@backend/types.ts";
import { articleCount, loadExistingArticles, persistDocument, readJob, upsertJob } from "@/lib/news/store";

const memory = new Map<string, IngestJob>();
let activeJobId: string | null = null;

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function newJobId() {
  return "job_" + randomBytes(6).toString("hex");
}

async function save(job: IngestJob) {
  memory.set(job.jobId, job);
  try {
    await upsertJob(job);
  } catch (error) {
    console.error("[news] failed to persist job", error);
  }
}

function getPythonCommand(): string {
  // 1. Explicit environment variable if specified
  if (process.env.PYTHON_BIN) {
    return process.env.PYTHON_BIN;
  }

  // 2. Test standard PATH commands
  const pathCandidates = ["python3", "python"];
  for (const cmd of pathCandidates) {
    try {
      const check = spawnSync(cmd, ["--version"], { stdio: "ignore" });
      if (check.status === 0) return cmd;
    } catch {
      // not found on PATH
    }
  }

  // 3. On Windows, check standard installation directories dynamically without user-specific paths
  if (process.platform === "win32") {
    const versionDirs = ["Python314", "Python313", "Python312", "Python311", "Python310"];
    const baseDirs: string[] = [];
    if (process.env.LOCALAPPDATA) {
      baseDirs.push(join(process.env.LOCALAPPDATA, "Programs", "Python"));
    }
    if (process.env.ProgramFiles) {
      baseDirs.push(join(process.env.ProgramFiles, "Python"));
    }
    for (const base of baseDirs) {
      for (const ver of versionDirs) {
        const full = join(base, ver, "python.exe");
        try {
          if (existsSync(full)) return full;
        } catch {
          // ignore
        }
      }
    }
  }

  return process.platform === "win32" ? "python" : "python3";
}

async function runPipelineSubprocess(): Promise<PipelineDocument> {
  return new Promise((resolve, reject) => {
    const pythonCmd = getPythonCommand();
    const args = [join(process.cwd(), "scraper", "pipeline.py"), "--stdout"];
    const proc = spawn(pythonCmd, args, {
      cwd: process.cwd(),
      shell: false,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python pipeline exited with code ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      try {
        const doc = JSON.parse(stdout.trim()) as PipelineDocument;
        resolve(doc);
      } catch (e) {
        reject(new Error(`Failed to parse Python pipeline output: ${(e as Error).message}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start Python pipeline: ${err.message}`));
    });
  });
}

async function runJob(jobId: string) {
  const job = memory.get(jobId);
  if (!job) return;
  job.status = "running";
  job.stage = "feeds";
  job.message = "Running Python ingestion";
  await save(job);
  try {
    const existing = await loadExistingArticles();
    const before = existing.length;
    const doc = await runPipelineSubprocess();
    await persistDocument(doc);
    const after = await articleCount();
    job.status = "complete";
    job.stage = "done";
    job.message = `Grouped ${doc.clusters.length} topics from ${doc.articles.length} articles`;
    job.articlesSeen = doc.stats.fetched;
    job.articlesNew = Math.max(after - before, 0);
    job.clustersBuilt = doc.clusters.length;
    job.finishedAt = nowIso();
    job.error = null;
    await save(job);
  } catch (error) {
    job.status = "failed";
    job.stage = "error";
    job.message = "Ingest failed";
    job.finishedAt = nowIso();
    job.error = error instanceof Error ? error.message : String(error);
    await save(job);
  } finally {
    if (activeJobId === jobId) activeJobId = null;
  }
}

export async function triggerIngest(): Promise<IngestJob> {
  if (activeJobId) {
    const current = memory.get(activeJobId) ?? (await readJob(activeJobId));
    if (current && (current.status === "queued" || current.status === "running")) {
      return current;
    }
  }
  const job: IngestJob = {
    jobId: newJobId(),
    status: "queued",
    stage: "queued",
    message: "Waiting to start",
    articlesSeen: 0,
    articlesNew: 0,
    clustersBuilt: 0,
    startedAt: nowIso(),
    finishedAt: null,
    error: null,
  };
  activeJobId = job.jobId;
  await save(job);
  void runJob(job.jobId);
  return job;
}

export async function jobStatus(jobId: string): Promise<IngestJob | null> {
  return memory.get(jobId) ?? (await readJob(jobId));
}

export async function ensureIngested(): Promise<IngestJob | null> {
  const count = await articleCount();
  if (count > 0) return null;
  return triggerIngest();
}
