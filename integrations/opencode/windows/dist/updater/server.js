import {createRequire as __createRequire} from 'node:module'; const require=__createRequire(import.meta.url);

// updater/common/coordinator.js
function decideStartup({ hostInSelectedAppContainer, authorizationComplete }) {
  return !hostInSelectedAppContainer && authorizationComplete ? "wrap" : "keep";
}
function createUpdater({ ports: ports2, startup: startup2, application = "application", prepareUpdates = false }) {
  const clients2 = /* @__PURE__ */ new Map(), sessions = /* @__PURE__ */ new Map(), tasks = /* @__PURE__ */ new Map(), operations2 = /* @__PURE__ */ new Set(), requests = /* @__PURE__ */ new Set();
  let sequence = 0, draining2 = false, startupReleased = false, finish;
  const closed = new Promise((resolve2) => {
    finish = resolve2;
  });
  const resource = (b) => JSON.stringify([b.installationResource ?? b.installation, b.configurationResource ?? b.configuration, b.profile]);
  const taskKey = (b) => JSON.stringify([resource(b), b.requestedRelease]);
  let shell;
  async function obtainTargetShell(binding) {
    const target = resource(binding);
    if (shell?.target === target) return shell.connection;
    const connection = await ports2.backend?.(binding);
    if (connection) shell = { target, connection };
    return connection;
  }
  const failure = (error) => error.result ?? { phase: error.authority === "uac_cancelled" ? "cancelled" : "failed", error: error.message };
  const active = (s) => s?.authorization_in_progress === true;
  const attemptFor = (value) => {
    const attempt = value.session.attempt;
    return attempt && (attempt.transition || attempt.binding.pid === value.binding.pid) ? attempt : void 0;
  };
  function tracked(binding, operation) {
    const work = { binding };
    operations2.add(work);
    work.promise = Promise.resolve().then(operation).finally(() => operations2.delete(work));
    work.promise.catch(() => {
    });
    return work.promise;
  }
  function status(value, authorization) {
    const session = value.session, task = session.task ?? value.task, attempt = attemptFor(value);
    const observed = session.wrapping ? { phase: "restarting" } : attempt?.state ?? authorization ?? task?.state;
    const matchingProtected = value.binding.protected && !task?.update && (task?.target ? resource(value.binding) === resource(task.target) : authorization !== void 0);
    const state = observed?.phase === "ready" && matchingProtected ? { phase: "protected" } : observed?.phase === "protected" && !value.binding.protected ? { phase: "starting" } : observed;
    const result = value.result ?? state ?? { phase: session.startupError ? "failed" : "starting" };
    const error = [result.error, session.startupError, task?.callError].filter(Boolean).join("; ");
    const reminderId = authorization ? authorization.attempt || resource(task?.target ?? value.binding) : task?.id;
    return {
      ...result,
      ...error ? { error } : {},
      ...authorization && task?.reason ? { reason: task.reason } : {},
      currentProtected: value.binding.protected === true,
      currentRelease: session.currentRelease,
      requestedRelease: task?.binding.requestedRelease ?? value.binding.requestedRelease,
      reminderDismissed: authorization ? session.dismissedReminder === reminderId : task?.dismissed === true,
      reminderId,
      reopenRequired: !draining2 && !session.closed && !attempt && state?.phase === "ready"
    };
  }
  async function observedStatus(value) {
    const result = status(value), task = value.session.task ?? value.task, target = task?.target ?? value.binding;
    if (task && !task.authorization || result.phase !== "starting" && !task?.authorization || value.result || value.session.wrapping || attemptFor(value) || !shell || shell.target !== resource(target)) return result;
    if (task?.observeAfter > Date.now()) return result;
    try {
      const state = await ports2.preparation(target, shell.connection);
      value.authorizationAttempt ??= active(state) ? state.attempt : void 0;
      const observed = value.authorizationAttempt && ports2.progress ? await readTask(target, shell.connection, state, value.authorizationAttempt) : state;
      if (!active(observed)) delete value.authorizationAttempt;
      return status(value, observed);
    } catch (error) {
      if (error.code === "observation_superseded") delete value.authorizationAttempt;
      throw error;
    }
  }
  function sessionFor(binding) {
    let session = sessions.get(binding.mainKey) ?? [...sessions.values()].find((current) => current.wrapping);
    if (!session) {
      session = { mainKey: binding.mainKey, binding, mainBinding: binding, bindings: /* @__PURE__ */ new Set(), closed: false, wrapping: false };
      sessions.set(binding.mainKey, session);
    }
    session.binding = binding;
    if (session.attempt && !session.attempt.transition && session.attempt.state.phase === "completed") session.attempt = void 0;
    return session;
  }
  async function readTask(binding, connection, state, attempt) {
    const progress = await ports2.progress(binding, connection, attempt);
    if (active(progress)) return { ...state, progress };
    const current = await ports2.preparation(binding, connection);
    if (current.attempt !== attempt) throw Object.assign(
      Error("Authorization observation was superseded"),
      { status: 409, code: "observation_superseded" }
    );
    return current;
  }
  async function wrapRestart(session, target, onStopped) {
    session.wrapping = true;
    try {
      await ports2.wrap(target, (mainKey) => {
        session.mainBinding = target;
        if (mainKey && mainKey !== session.mainKey) {
          sessions.delete(session.mainKey);
          session.mainKey = mainKey;
          sessions.set(mainKey, session);
          for (const value of clients2.values()) if (value.session === session && value.binding.mainKey !== mainKey) value.released = true;
        }
      }, onStopped);
    } finally {
      session.wrapping = false;
    }
    await ports2.watchMain?.(session.mainBinding);
  }
  function executeStartup(binding, target) {
    const session = sessionFor(binding);
    if (session.wrapping || session.attempt?.transition) return { accepted: true };
    const attempt = { binding, state: { phase: "restarting" }, transition: true };
    session.attempt = attempt;
    session.wrapping = true;
    attempt.promise = tracked(binding, async () => {
      try {
        await wrapRestart(session, target, () => {
        });
        attempt.state = { phase: "completed" };
      } catch (error) {
        attempt.state = failure(error);
        ports2.report?.(error, target, "wrap");
        if (!await ports2.mainAlive(startup2 ?? binding)) stop();
      } finally {
        attempt.transition = false;
      }
    });
    return { accepted: true };
  }
  function exit2(session) {
    const attempt = { binding: session.binding, state: { phase: "exiting" }, transition: true };
    session.attempt = attempt;
    attempt.promise = tracked(session.binding, async () => {
      try {
        await ports2.exit(session.binding);
        stop();
      } catch (error) {
        attempt.state = failure(error);
        ports2.report?.(error, session.binding, "exit");
      } finally {
        attempt.transition = false;
      }
    });
    return { accepted: true };
  }
  async function assess(task, session, value) {
    try {
      const b = task.binding, release = b.requestedRelease;
      if (!/^\d+\.\d+\.\d+$/.test(release)) throw Error("A requested stable native release is required");
      task.target = await ports2.select(b, release);
      const current = await ports2.installation(b);
      session.currentRelease = current?.version;
      const readOnly = b.manageInstallation === false || b.settings?.manageInstallation === false;
      if (readOnly && task.installOnly) throw Error("The selected FinSAFE installation is read-only to this plugin");
      task.update = !readOnly && Boolean(current && current.version !== release);
      const alreadyProtected = b.protected && (readOnly || current?.version === release) && resource(task.target) === resource(b);
      if (alreadyProtected && !task.installOnly) {
        task.state = { phase: "protected" };
        return;
      }
      const installed = readOnly ? current : await ports2.installation(task.target);
      let needsSetup = !readOnly && (!installed || installed.version !== release), backendObtained = false, connection;
      if (!needsSetup && !task.installOnly) {
        try {
          connection = await obtainTargetShell(task.target);
          backendObtained = true;
        } catch (error) {
          if (readOnly || error.code !== "ENOENT" || error.path !== task.target.settings?.executable) throw error;
          needsSetup = true;
        }
      }
      if (needsSetup) {
        task.state = { phase: "downloading" };
        task.download = new AbortController();
        task.staged = await ports2.stage(task.target, release, task.download.signal);
        task.download = void 0;
        if (draining2 || session.closed || !await ports2.mainAlive(b)) return;
        task.state = { phase: "installing" };
        const setup = await ports2.install(task.target, release, task.staged);
        if (setup.phase !== "completed") {
          task.state = setup;
          return;
        }
        Object.assign(task.target, await ports2.select(b, release));
        await ports2.selected?.(b, task.target);
      }
      if (draining2 || session.closed || !await ports2.mainAlive(b)) return;
      if (task.installOnly && !prepareUpdates) {
        if (!needsSetup) await ports2.selected?.(b, task.target);
        task.state = { phase: "ready", reason: "update", authorizationPending: true };
        return;
      }
      if (!backendObtained) connection = await obtainTargetShell(task.target);
      task.reason = task.update ? "update" : needsSetup ? "install" : "authorization";
      task.state = { phase: "authorizing", reason: task.reason };
      const submission = readOnly ? void 0 : await ports2.prepare(task.target, connection);
      task.authorization = true;
      if (!readOnly) task.observeAfter = Date.now() + 3e3;
      if (!readOnly) {
        const completion = submission?.completion ? await submission.completion : submission;
        if (Number.isInteger(completion?.exit_code) && completion.exit_code !== 0)
          throw Error(completion.error || `Desktop authorization command exited (${completion.exit_code})`);
      }
    } catch (error) {
      if (task.authorization) task.callError = error.message;
      else task.state = failure(error);
      ports2.report?.(error, task.target ?? session.binding, "prepare");
    } finally {
      task.done = true;
      tasks.delete(taskKey(task.binding));
    }
  }
  function stop() {
    draining2 = true;
    for (const session of new Set(sessions.values())) session.closed = true;
    for (const task of tasks.values()) task.download?.abort();
    finish();
  }
  async function drain() {
    stop();
    for (; ; ) {
      const work = [...requests, ...operations2].map((item) => item.promise ?? item);
      if (!work.length) break;
      await Promise.allSettled(work);
    }
    for (const session of new Set(sessions.values())) for (const binding of session.bindings) {
      await ports2.detach(binding);
    }
    if (startup2 && !startupReleased) {
      startupReleased = true;
      await ports2.detach(startup2);
    }
  }
  async function beginAssessment(value, installOnly = false) {
    const { binding, session } = value;
    const attempt = attemptFor(value);
    if (value.task && !value.task.done || session.wrapping || attempt?.transition) return { accepted: true };
    session.startupError = void 0;
    session.attempt = void 0;
    let task = tasks.get(taskKey(binding)) ?? [...tasks.values()].find((t) => !t.done && t.target && t.binding.requestedRelease === binding.requestedRelease && resource(t.target) === resource(binding));
    if (!task || task.done) {
      const ownInstall = binding.installationResource ?? binding.installation;
      const ownConfig = binding.configurationResource ?? binding.configuration;
      if ([...tasks.values()].some((t) => !t.done && ((t.binding.installationResource ?? t.binding.installation) === ownInstall || (t.binding.configurationResource ?? t.binding.configuration) === ownConfig) && resource(t.binding) !== resource(binding)))
        throw Error("Selected installation/configuration conflict with active native work");
      task = { id: String(++sequence), binding, installOnly, state: { phase: "starting" }, done: false };
      tasks.set(taskKey(binding), task);
      task.promise = tracked(binding, () => assess(task, session, value));
    }
    value.task = task;
    session.task = task;
    return { accepted: true };
  }
  return {
    closed,
    async admit(binding) {
      if (sessions.size && !sessions.has(binding.mainKey) && ![...sessions.values()].some((session2) => session2.wrapping))
        throw Error(`Updater already owns another ${application} Main`);
      const session = sessionFor(binding);
      if (session.wrapping || session.attempt?.transition) return { period: "keep" };
      session.startupError = void 0;
      let target, authorizationComplete = false;
      try {
        if (!binding.protected) {
          target = await ports2.select(binding, binding.requestedRelease, { startup: true });
          if (ports2.startupReady) {
            const connection = await obtainTargetShell(target);
            authorizationComplete = await ports2.startupReady(target, connection);
          } else {
            const connection = await obtainTargetShell(target);
            const state = await ports2.preparation(target, connection);
            authorizationComplete = state?.prepared === true && !active(state);
          }
        }
      } catch (error) {
        if (error.cancelled === true) return { period: "keep", cancelled: true };
        if (error.code !== "ENOENT" || error.path !== target?.settings?.executable) {
          session.startupError = error.message;
          ports2.report?.(error, target ?? binding, "startup_readiness");
        }
      }
      const period = decideStartup({ hostInSelectedAppContainer: binding.protected === true, authorizationComplete });
      return { period, ...period === "wrap" ? { target } : {}, ...session.startupError ? { error: session.startupError } : {} };
    },
    executeStartup,
    async bind(peer) {
      const binding = await ports2.bind(peer), id = String(++sequence);
      const session = sessionFor(binding);
      session.bindings.add(binding);
      session.binding = binding;
      clients2.set(id, { binding, session, released: false });
      return id;
    },
    request(id, operation, fields = {}) {
      const request = (async () => {
        if (Object.keys(fields).some((key) => operation !== "install" || key !== "release")) throw Error("Unknown operation fields");
        if (!["status", "ensure", "install", "exit", "later", "restore", "release", "uninstall"].includes(operation)) throw Error("Unknown operation");
        const value = clients2.get(id);
        if (!value || value.released) throw Error("Unknown client binding");
        const { binding, session } = value;
        if (operation === "status") return observedStatus(value);
        if (operation === "exit") return exit2(session);
        if (operation === "restore" || operation === "release") {
          if (operation === "release") value.released = true;
          const pendingWork = [
            session.attempt?.transition && session.attempt.promise,
            session.task && !session.task.done && session.task.promise
          ].filter(Boolean);
          if (pendingWork.length && operation === "release") {
            void tracked(binding, async () => {
              await Promise.allSettled(pendingWork);
              await ports2.restore(binding);
            }).catch((error) => ports2.report?.(error));
            return { released: true, cleanupPending: true };
          }
          await tracked(binding, async () => {
            await Promise.allSettled(pendingWork);
            await ports2.restore(binding);
          });
          return operation === "release" ? { released: true } : { restored: true };
        }
        if (draining2 || session.closed) throw Error("Updater is draining");
        if (!await ports2.alive(binding)) throw Error(`Bound ${application} process departed`);
        if (operation === "ensure") {
          value.ensureIntent = true;
          return beginAssessment(value);
        }
        if (operation === "install") return beginAssessment({
          ...value,
          task: void 0,
          binding: { ...binding, requestedRelease: fields.release }
        }, true);
        if (operation === "later") {
          const task = session.task ?? value.task;
          const observed = await observedStatus(value);
          if (observed.phase !== "ready") throw Error("No current reopen reminder");
          session.dismissedReminder = observed.reminderId;
          if (task) task.dismissed = true;
          return { dismissed: true };
        }
        if (operation === "uninstall") {
          if (binding.protected) throw Error("Native uninstall requires an ordinary session");
          if ([...operations2].some((work) => resource(work.binding) === resource(binding))) throw Error("Native operation conflict");
          try {
            await ports2.restore(binding);
          } catch (error) {
            ports2.report?.(error, binding, "uninstall_cleanup");
          }
          void tracked(binding, async () => {
            try {
              const result = await ports2.uninstall(binding);
              value.result = { phase: result?.code ? "failed" : "completed", nativeUninstall: result };
            } catch (error) {
              value.result = failure(error);
            }
          });
          return { accepted: true };
        }
      })();
      if (operation === "status") return request;
      requests.add(request);
      return request.finally(() => requests.delete(request));
    },
    async observeMainExits() {
      if (draining2) return true;
      const current = [...new Set(sessions.values())];
      const replacingMain = (session) => session.wrapping && !ports2.retainsMainDuringWrap;
      if (!current.length) {
        if (startup2 && !await ports2.mainAlive(startup2)) {
          stop();
          return true;
        }
        return false;
      }
      for (const session of current) {
        if (replacingMain(session)) continue;
        if (!await ports2.mainAlive(session.mainBinding)) session.closed = true;
      }
      if (current.every((session) => session.closed || replacingMain(session))) {
        if (current.every(replacingMain)) return false;
        stop();
        return true;
      }
      return false;
    },
    stop,
    drain
  };
}

// updater/common/protocol.js
var protocol = 1;
var operations = ["hello", "bind", "admit", "status", "ensure", "install", "exit", "later", "restore", "release", "uninstall"];
function projectState(value) {
  if (typeof value?.phase !== "string" || value.phase.length > 64) throw Error("Invalid native phase");
  const result = { phase: value.phase, reopenRequired: value.reopenRequired };
  for (const name of ["currentProtected", "authorizationPending", "reminderDismissed"]) if (typeof value[name] === "boolean") result[name] = value[name];
  for (const name of ["currentRelease", "requestedRelease", "reason", "reminderId"]) if (typeof value[name] === "string") result[name] = value[name];
  if (value.error) result.error = String(value.error).slice(0, 2048);
  if (value.authorization) {
    result.authorization = {};
    for (const name of ["phase", "prepared", "authorization_in_progress", "exit_code"])
      if (value.authorization[name] !== void 0) result.authorization[name] = value.authorization[name];
    if (value.authorization.error) result.authorization.error = String(value.authorization.error).slice(0, 2048);
  }
  if (value.progress) {
    const percent = value.progress.overall_percent ?? null;
    if (percent !== null && (typeof percent !== "number" || !Number.isFinite(percent))) throw Error("Invalid native percentage");
    result.progress = { overall_percent: percent };
    const current = Array.isArray(value.progress.items) ? value.progress.items.find((item) => item.state === "start") : void 0;
    if (typeof current?.path === "string") result.progress.items = [{
      path: current.path.slice(0, 1024),
      ...typeof current.state === "string" ? { state: current.state.slice(0, 64) } : {}
    }];
  }
  for (const name of ["prepared", "authorization_in_progress"]) if (typeof value[name] === "boolean") result[name] = value[name];
  if (value.nativeSetup) result.nativeSetup = { code: value.nativeSetup.code, phase: value.nativeSetup.phase };
  if (value.nativeUninstall) result.nativeUninstall = { code: value.nativeUninstall.code };
  return result;
}
function validateRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid updater request");
  if (value.protocol !== void 0 && !Number.isSafeInteger(value.protocol)) throw Error("Invalid updater framing label");
  if (!operations.includes(value.operation)) throw Error("Unknown updater operation");
  const allowed = ["hello", "bind", "admit"].includes(value.operation) ? value.operation === "hello" ? ["protocol", "operation"] : ["protocol", "operation", "context"] : value.operation === "install" ? ["protocol", "operation", "client", "release"] : ["protocol", "operation", "client"];
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw Error("Unknown updater request fields");
  if (!["hello", "bind", "admit"].includes(value.operation) && typeof value.client !== "string") throw Error("Missing updater client binding");
  if (value.operation === "install" && typeof value.release !== "string") throw Error("Missing installation release");
  return value;
}

// updater/common/transport.js
async function handleRequest(message, { dispatch: dispatch2, reply }) {
  let continuation, response;
  try {
    response = { ok: true, value: await dispatch2(message, (action) => {
      continuation = action;
    }) };
  } catch (error) {
    response = { ok: false, error: error.message.slice(0, 2048) };
  }
  await reply(response);
  if (response.ok) continuation?.();
}

// updater/common/index.js
import { appendFile } from "node:fs/promises";
function createDiagnostics(destination, { append = appendFile } = {}) {
  return (fields) => {
    try {
      if (destination) void append(destination, JSON.stringify(fields) + "\n").catch(() => {
      });
    } catch {
    }
  };
}

// updater/server.js
import { readFileSync as readFileSync3 } from "node:fs";
import { join as join4, dirname as dirname2 } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID as randomUUID2 } from "node:crypto";

// updater/native.js
import { createRequire as createRequire2 } from "node:module";
import { join as join2 } from "node:path";

// updater/common/package.js
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join, isAbsolute, dirname, resolve } from "node:path";
var sdkName = "@finogeeks2026/finsafe-sdk";
function packageSdk(root2, { sourceRoot = root2 } = {}) {
  const read = (directory) => JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  const plugin = read(root2);
  const sdkRoot = join(sourceRoot, "node_modules", sdkName);
  return {
    root: sdkRoot,
    version: plugin.version,
    load: () => createRequire(join(root2, "package.json"))(join(sdkRoot, "src", "native.js"))
  };
}

// updater/native.js
function nativeAdapter(root2, {
  require: require2 = createRequire2(join2(root2, "package.json")),
  sdk: sdk2 = packageSdk(root2).load()
} = {}) {
  const native2 = sdk2.createClient();
  const call2 = (request) => native2({
    module: "app_seam.opencode",
    request: request.action === "stage_configuration" ? { ...request, candidate: join2(root2, "policy", "candidate.yaml") } : request
  });
  call2.watchMain = (request, onExit) => native2.watchMain({ module: "app_seam.opencode", request }, onExit);
  call2.buildInfo = native2.buildInfo;
  call2.libraryPath = native2.libraryPath;
  call2.sdkRoot = native2.sdkRoot;
  return call2;
}

// src/known-folders.js
import { loadKoffi } from "../node_modules/@finogeeks2026/finsafe-sdk/src/native.js";
function readKnownFolders() {
  const koffi = loadKoffi();
  const ole = koffi.load("ole32.dll"), shell = koffi.load("shell32.dll");
  const guid = ole.func("int32_t __stdcall CLSIDFromString(str16 text, void* value)");
  const folder = shell.func("int32_t __stdcall SHGetKnownFolderPath(void* id, uint32_t flags, void* token, void* path)");
  const free = ole.func("void __stdcall CoTaskMemFree(void* value)");
  const result = {};
  for (const [key, id] of Object.entries({
    programFiles: "{905E63B6-C1BF-494E-B29C-65B732D3D21A}",
    programData: "{62AB5D82-FDC1-4DC3-A9DD-070D1D495D97}",
    localAppData: "{F1B32785-6FBA-4FCF-9D55-7B8E7F157091}"
  })) {
    const value = Buffer.alloc(16), out = Buffer.alloc(koffi.sizeof("void*"));
    if (guid(id, value) !== 0) throw new Error("Invalid known-folder identifier");
    const code = folder(value, 65536, null, out);
    if (code !== 0) throw new Error(`SHGetKnownFolderPath ${key}: HRESULT ${code}`);
    const pointer = koffi.decode(out, "void*");
    try {
      result[key] = koffi.decode(out, "str16");
    } finally {
      free(pointer);
    }
  }
  return result;
}

// updater/coordinator.js
var createUpdater2 = (options2) => createUpdater({ ...options2, application: "OpenCode" });

// updater/management.js
function createManagement(options2) {
  const updater2 = createUpdater2(options2), request = updater2.request;
  updater2.request = (id, operation, fields) => operation === "uninstall" ? Promise.reject(Error("Plugin removal retains FinSAFE runtime, configuration and authorization")) : request(id, operation, fields);
  return updater2;
}

// src/preparation.js
import { createRequire as createRequire3 } from "node:module";

// src/connector.js
import { execFile, spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { EventEmitter } from "node:events";
function nativeDesktopChild({ start, read }) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  queueMicrotask(async () => {
    try {
      const owner = await start();
      for (; ; ) {
        const result = await read(owner.owner);
        if (result.stdout) child.stdout.emit("data", result.stdout);
        if (result.stderr) child.stderr.emit("data", result.stderr);
        if (result.eof) {
          child.emit("close", result.code, null);
          return;
        }
      }
    } catch (error) {
      child.emit("error", error);
    }
  });
  return child;
}
function submitDesktopAuthorization(executable, args, { spawnChild = spawn, env } = {}) {
  return new Promise((resolve2, reject) => {
    const child = spawnChild(executable, args, { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const decoder = new StringDecoder("utf8");
    let buffer = "", diagnostics = "", ack, terminal, resolveCompletion, rejectCompletion, transportError;
    const completion = new Promise((yes, no) => {
      resolveCompletion = yes;
      rejectCompletion = no;
    });
    completion.catch(() => {
    });
    child.stderr.on("data", (bytes) => {
      diagnostics = (diagnostics + bytes).slice(-65536);
    });
    child.stdout.on("data", (bytes) => {
      if (transportError) return;
      buffer += Buffer.isBuffer(bytes) ? decoder.write(bytes) : bytes;
      try {
        let end;
        while ((end = buffer.indexOf("\n")) >= 0) {
          if (Buffer.byteLength(buffer.slice(0, end)) > 16384) throw Error("Desktop result frame exceeds 16 KiB");
          const frame = JSON.parse(buffer.slice(0, end));
          buffer = buffer.slice(end + 1);
          if (!frame.value || typeof frame.value !== "object") throw Error("Invalid Desktop result");
          if (frame.record === "ack" && !ack && !terminal) {
            ack = frame.value;
            if (ack.error) throw Error(ack.error);
            resolve2({ ...ack, completion });
          } else if (frame.record === "terminal" && ack && !terminal) terminal = frame.value;
          else throw Error("Unexpected Desktop result frame");
        }
        if (Buffer.byteLength(buffer) > 16384) throw Error("Desktop result frame exceeds 16 KiB");
      } catch (error) {
        transportError = error;
        if (!ack) reject(error);
      }
    });
    child.on("error", (error) => {
      transportError = error;
      reject(error);
      rejectCompletion(error);
    });
    child.on("close", (code, signal) => {
      buffer += decoder.end();
      const error = transportError ?? (buffer.length ? Error("Desktop result ended with a truncated frame") : signal || !Number.isInteger(code) ? Error(`Desktop task ended by ${signal ?? "unknown exit"}`) : terminal && Number.isInteger(terminal.exit_code) && terminal.exit_code !== code ? Error(`Desktop task exit ${code} differs from terminal ${terminal.exit_code}`) : !ack ? Error(`Desktop acknowledgment missing (${code}): ${diagnostics}`) : ack.accepted && !terminal ? Error(`Desktop task exited without terminal result (${code}): ${diagnostics}`) : code && !terminal ? Error(`Desktop task exited (${code}): ${diagnostics}`) : void 0);
      if (error) {
        reject(error);
        rejectCompletion(error);
        return;
      }
      resolveCompletion(terminal ?? ack);
    });
  });
}

// src/preparation.js
var sdk = () => createRequire3(import.meta.url)("../node_modules/@finogeeks2026/finsafe-sdk/src/native.js");
var options = (settings) => ({ env: {
  ...process.env,
  LOCALAPPDATA: settings.localAppData
} });
function prepareRuntime(settings, { run = submitDesktopAuthorization } = {}) {
  return run(
    settings.executable,
    [
      "desktop",
      "configuration",
      "apply",
      "--json",
      "--yaml-path",
      settings.yamlPath,
      ...settings.retainedWorker ? ["--retained-worker", settings.retainedWorker] : []
    ],
    options(settings)
  );
}
function readPreparation(connection, { attempt, client = sdk().createStatusClient } = {}) {
  const status = client(connection);
  return attempt === void 0 ? status.authorizationState() : status.authorizationProgress(attempt);
}
var obtainShell = (settings) => sdk().obtainShell(settings);

// updater/common/download.js
import { createHash } from "node:crypto";
function verifyPayload(bytes, sums, name) {
  const matches = sums.split(/\r?\n/).map((line) => /^([a-f0-9]{64})\s+\*?(.+)$/i.exec(line)).filter((match) => match?.[2] === name);
  if (matches.length !== 1) throw new Error("Expected exactly one official Windows payload checksum");
  if (createHash("sha256").update(bytes).digest("hex") !== matches[0][1].toLowerCase())
    throw new Error("FinSAFE payload SHA256 mismatch");
}
async function downloadInstaller(version2, cdnBaseUrl, options2 = {}) {
  options2.signal?.throwIfAborted();
  const controller = new AbortController();
  const signal = options2.signal ? AbortSignal.any([options2.signal, controller.signal]) : controller.signal;
  const name = `finshield-${version2}-x64-setup.exe`;
  async function download(url, format) {
    try {
      const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(3e4)]) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response[format]();
    } catch (error) {
      throw new Error(`FinShield download failed: ${error.message}: ${url}`, { cause: error });
    }
  }
  async function cdn() {
    const base = `${cdnBaseUrl.replace(/\/$/, "")}/releases/download/v${version2}`;
    const metadata = await download(`${base}/release.json`, "json");
    const assets = metadata?.version === version2 && Array.isArray(metadata.assets) ? metadata.assets.filter((asset2) => asset2?.name === name && asset2.kind === "windows-installer") : [];
    const asset = assets[0], prefix = `finshield-${version2}-x64-setup-`;
    if (assets.length !== 1 || typeof asset.mirror_name !== "string" || !asset.mirror_name.startsWith(prefix) || !/^[a-f0-9]{32}\.exe$/.test(asset.mirror_name.slice(prefix.length)) || !/^[a-f0-9]{64}$/i.test(asset.sha256))
      throw new Error("Invalid FinShield release metadata for requested Windows installer");
    const bytes = Buffer.from(await download(`${base}/${asset.mirror_name}`, "arrayBuffer"));
    verifyPayload(bytes, `${asset.sha256}  ${name}`, name);
    return bytes;
  }
  async function github() {
    const base = `https://github.com/finogeeks/finsafe/releases/download/v${version2}`;
    const [payload, sums] = await Promise.all([
      download(`${base}/${name}`, "arrayBuffer"),
      download(`${base}/SHA256SUMS`, "text")
    ]);
    const bytes = Buffer.from(payload);
    verifyPayload(bytes, sums, name);
    return bytes;
  }
  try {
    return await Promise.any([cdn(), github()]);
  } catch (error) {
    options2.signal?.throwIfAborted();
    throw new AggregateError(
      error.errors,
      `FinShield CDN and GitHub download failed: ${error.errors.map((e) => e.message).join("; ")}`
    );
  } finally {
    controller.abort();
  }
}

// install/runtime.js
import { randomUUID } from "node:crypto";
import { existsSync as existsSync2, mkdirSync, mkdtempSync, readFileSync as readFileSync2, writeFileSync } from "node:fs";
import { join as join3 } from "node:path";
async function stageRuntime(destination, version2, options2 = {}) {
  if (options2.confined) throw new Error("Protected Host cannot install or prepare native FinSAFE; reopen ordinary OpenCode");
  if (!/^\d+\.\d+\.\d+$/.test(version2)) throw new Error("A stable FinSAFE version is required");
  const name = `finshield-${version2}-x64-setup.exe`;
  const { cdnBaseUrl } = JSON.parse(readFileSync2(new URL("./download-source.json", import.meta.url), "utf8"));
  const bytes = await downloadInstaller(version2, cdnBaseUrl, options2);
  mkdirSync(destination, { recursive: true });
  const root2 = mkdtempSync(join3(destination, version2 + "-"));
  writeFileSync(join3(root2, name), bytes);
  return { version: version2, package: join3(root2, name) };
}
async function installRuntime(destination, version2, options2 = {}) {
  if (options2.confined) throw Error("Protected Host cannot install native FinSAFE");
  if (!options2.execute || !options2.installation || !options2.configuration || !options2.candidate)
    throw Error("OpenCode setup requires an SDK-bound target and its staged Candidate");
  const staged = options2.staged ?? await stageRuntime(destination, version2, options2);
  if (staged.version !== version2) throw Error("Staged release differs from requested native target");
  const packagePath = staged.package;
  const operationId = randomUUID();
  const request = {
    version: version2,
    package: packagePath,
    operation_id: operationId,
    installation: options2.installation,
    configuration: options2.configuration,
    previousInstallation: options2.previousInstallation,
    candidate: options2.candidate,
    integration_outputs: false,
    self_update_enabled: false
  };
  options2.onRequest?.(request);
  const result = await options2.execute(request);
  if (![0, 3010, 1641].includes(result.code)) {
    const error = new Error(`Windows setup returned ${result.code}: ${result.detail || result.stderr || ""}`);
    error.setupCode = result.code;
    const observed = observeSetupResult({ phase: "installing" }, result.resultPath);
    error.result = {
      ...observed,
      phase: observed.nativeSetup ? observed.phase : "failed",
      error: observed.error || error.message,
      nativeSetup: observed.nativeSetup ?? { code: result.code }
    };
    throw error;
  }
  return {
    executable: join3(request.installation, "finsafe.exe"),
    yamlPath: join3(request.configuration, "effective.yaml"),
    configuration: request.configuration,
    exitCode: result.code,
    resultPath: result.resultPath,
    retainedWorker: result.retainedWorker,
    rebootRequired: result.code !== 0
  };
}
function observeSetupResult(state, path) {
  if (!path || !existsSync2(path)) return state;
  const result = JSON.parse(readFileSync2(path, "utf8"));
  if (!Number.isInteger(result.code) || !["completed", "cancelled", "failed", "reboot-required"].includes(result.phase)) {
    throw new Error("Invalid native setup result");
  }
  return { ...state, ...state.phase === "installing" ? { phase: result.phase, error: result.detail || void 0 } : {}, nativeSetup: result };
}

// updater/operations.js
function createOperations({ native: native2, call: call2, read = readPreparation, stage = stageRuntime, install = installRuntime, authorize }) {
  const submit = authorize ?? ((b) => prepareRuntime({ ...b.settings, retainedWorker: b.retainedWorker }, {
    run: (exe, args, options2) => submitDesktopAuthorization(exe, args, {
      ...options2,
      spawnChild: () => nativeDesktopChild({
        start: () => native2(b, "authorization_start", { retainedWorker: b.retainedWorker }),
        read: (owner) => call2({ action: "authorization_read", owner })
      })
    })
  }));
  return {
    installation: (b) => native2(b, "installation", { selected: b.selected === true }),
    async select(b, release, { startup: startup2 = false } = {}) {
      const selected = await native2(b, "select_target", { release, startup: startup2, ...b.roots });
      return { ...b, ...selected, selected: true, settings: { ...b.settings, ...selected, version: release } };
    },
    async stage(b, release, signal) {
      return stage(b.settings.downloads, release, { signal });
    },
    async install(b, release, staged) {
      if (staged.installed) return { phase: "completed" };
      const candidate = await native2(b, "stage_configuration"), inputs = await native2(b, "setup_inputs");
      const result = await install(b.settings.downloads, release, {
        ...b.settings,
        ...candidate,
        ...inputs,
        staged,
        execute: (request) => native2(b, "run_setup", { request })
      });
      b.retainedWorker = result.retainedWorker;
      return { phase: result.rebootRequired ? "reboot-required" : "completed", nativeSetup: { code: result.exitCode } };
    },
    async prepare(b, connection) {
      const result = await submit(b);
      b.retainedWorker = void 0;
      return result;
    },
    preparation: (_b, connection) => read(connection),
    progress: (_b, connection, attempt) => read(connection, { attempt })
  };
}

// updater/launch.js
async function launchHost(binding, { replace, confirm, record: record2 = () => {
}, listen, onStopped = () => {
}, observeReplacement = () => {
} }) {
  if (listen) await listen();
  const oldHostPid = binding.pid, result = await replace();
  if (result.main_pid !== binding.main || result.mainKey !== binding.mainKey)
    throw Error("OpenCode Main identity changed during Host handoff");
  onStopped(false);
  record2("ac-host-ready", {
    oldMainPid: binding.main,
    oldHostPid,
    mainPid: result.main_pid,
    mainKey: result.mainKey,
    newHostPid: result.host_pid,
    corePid: result.core_pid
  });
  await confirm(result);
  binding.pid = result.host_pid;
  binding.protected = true;
  observeReplacement(result.mainKey);
  record2("main-host-connected", { mainKey: result.mainKey, hostPid: result.host_pid });
  return result;
}
function createConnectionConfirmation({ timeout = 45e3 } = {}) {
  const attempts = /* @__PURE__ */ new Map();
  return {
    begin(mainKey) {
      if (attempts.has(mainKey)) throw Error("OpenCode Host handoff is already active");
      let resolve2, reject, timer, expected;
      const completion = new Promise((yes, no) => {
        resolve2 = yes;
        reject = no;
      }), seen = /* @__PURE__ */ new Set();
      const attempt = { seen, observe(pid) {
        seen.add(pid);
        if (pid === expected) resolve2();
      } };
      attempts.set(mainKey, attempt);
      return { async wait(result) {
        expected = result.host_pid;
        if (seen.has(expected)) return;
        timer = setTimeout(() => reject(Error("OpenCode Main did not confirm its business connection to the protected Host")), timeout);
        try {
          await completion;
        } finally {
          clearTimeout(timer);
        }
      }, dispose() {
        clearTimeout(timer);
        attempts.delete(mainKey);
      } };
    },
    observe(binding) {
      if (binding.protected && binding.context?.connectedHostPid === binding.pid)
        attempts.get(binding.mainKey)?.observe(binding.pid);
    }
  };
}

// updater/server.js
delete process.env.BUN_BE_BUN;
var root = fileURLToPath(new URL("../", import.meta.url));
var diagnostic = createDiagnostics(process.argv[7]);
var record = (event, fields = {}) => diagnostic({ at: (/* @__PURE__ */ new Date()).toISOString(), event, ...fields });
var report = (error) => record("error", { error: error.message, stack: error.stack });
process.on("uncaughtExceptionMonitor", report);
var version = JSON.parse(readFileSync3(join4(root, "package.json"), "utf8")).version;
record("runtime", { executable: process.execPath, bunVersion: process.versions.bun ?? null, version });
var call = nativeAdapter(root);
var folders = readKnownFolders(root);
var build = { version };
await call({ action: "select_slot", installation: process.argv[2], configuration: process.argv[3] });
var startup = await call({ action: "retain_startup_main", pid: Number(process.argv[4]), created: process.argv[5] });
process.env.OPENCODE_INSTALL_DIR = dirname2(startup.image);
await call({ action: "initialize_session_job", deadline: Number(process.argv[6]) });
var clients = /* @__PURE__ */ new Map();
var roots = /* @__PURE__ */ new Map();
var confirmations = createConnectionConfirmation();
var mainWait;
var protectedEndpoint;
var draining = false;
var exit = (code) => call({ action: "exit_updater", code }).catch(report);
var native = (b, action, fields = {}) => {
  if (b.closing) return Promise.reject(Error("Native binding is closing"));
  const previous = [...b.calls].at(-1);
  const pending = Promise.resolve(previous).catch(() => {
  }).then(() => call({ action, native: b.native, ...fields }));
  b.calls.add(pending);
  return pending.finally(() => b.calls.delete(pending));
};
var ports = {
  backend: (b) => obtainShell(b.settings),
  exit: (b) => native(b, "stop_main"),
  retainsMainDuringWrap: true,
  async watchMain(b) {
    const previous = mainWait;
    mainWait = void 0;
    await previous?.();
    mainWait = call.watchMain(b.native ? { native: b.native } : { startup: startup.startup }, () => {
      void updater.observeMainExits().catch((error) => {
        report(error);
        void exit(1);
      });
    });
  },
  bind: async (b) => b,
  alive: (b) => native(b, "alive"),
  mainAlive: (b) => b.native ? native(b, "main_alive") : call({ action: "startup_main_alive", startup: startup.startup }),
  ...createOperations({ native, call }),
  restore: async () => {
  },
  async detach(b) {
    if (!b.native) return call({ action: "detach_startup_main", startup: startup.startup });
    b.closing = true;
    await Promise.allSettled([...b.calls]);
    return call({ action: "detach", native: b.native });
  },
  async wrap(b, observeReplacement, onStopped) {
    const confirmation = confirmations.begin(b.mainKey);
    try {
      return await launchHost(b, {
        record,
        observeReplacement,
        onStopped,
        confirm: confirmation.wait,
        replace: () => native(b, "replace_host"),
        listen: async () => {
          protectedEndpoint ??= call({ action: "server", container: true }).then((server) => {
            void serve(server.server).catch((error) => {
              report(error);
              void exit(1);
            });
          });
          await protectedEndpoint;
        }
      });
    } finally {
      confirmation.dispose();
    }
  },
  report
};
var updater = createManagement({ ports, startup });
await ports.watchMain(startup);
void updater.closed.then(() => {
  if (!draining) {
    draining = true;
    void exit(0);
  }
});
async function materialize(message, context) {
  const b = await call({ action: "bind", connection: message.connection, context });
  const c = b.context;
  record("host-bound", { hostPid: b.pid, mainPid: b.main, protected: b.protected });
  if (!b.protected) roots.set(b.profile, { nativeVersionRoot: c.nativeVersionRoot, configurationVersionRoot: c.configurationVersionRoot, downloads: join4(folders.localAppData, "FinSAFE", "opencode-plugin/downloads") });
  const trusted = roots.get(b.profile);
  if (!trusted) throw Error("No ordinary-bound OpenCode version roots");
  const binding = { ...b, ...c, calls: /* @__PURE__ */ new Set(), roots: trusted, settings: { ...c, ...folders, executable: join4(c.installation, "finsafe.exe"), yamlPath: join4(c.configuration, "effective.yaml"), downloads: trusted.downloads } };
  return binding;
}
async function dispatch(message, afterReply) {
  const request = validateRequest(message.request);
  if (request.operation === "hello") return {
    version,
    protocol,
    draining,
    sdkManagement: true,
    retainedMainHost: true,
    usageContext: true,
    sdk: { ...build, root: call.sdkRoot, libraryPath: call.libraryPath }
  };
  if (["admit", "bind"].includes(request.operation)) {
    if (draining) throw Error("Updater is draining");
    const peer = await materialize(message, request.context);
    if (request.operation === "admit") {
      const { target, ...decision } = await updater.admit(peer);
      if (decision.period === "wrap") afterReply(() => updater.executeStartup(peer, target));
      return decision;
    }
    const client = randomUUID2();
    clients.set(client, { id: await updater.bind(peer), peer: message.peer });
    confirmations.observe(peer);
    return { client };
  }
  const binding = clients.get(request.client);
  if (!binding || binding.peer !== message.peer) throw Error("Updater client identity mismatch");
  try {
    const result = await updater.request(binding.id, request.operation, request.operation === "install" ? { release: request.release } : {});
    return request.operation === "status" ? projectState(result) : result;
  } finally {
    if (request.operation === "release") clients.delete(request.client);
  }
}
async function serve(server) {
  for (; ; ) {
    let message;
    try {
      message = await call({ action: "receive", server });
    } catch (error) {
      if (error.message.includes("updater listener")) throw error;
      report(error);
      continue;
    }
    if (!message) continue;
    void handleRequest(message, { dispatch, reply: (response) => call({ action: "reply", connection: message.connection, response }) }).catch(report);
  }
}
for (const signal of ["SIGINT", "SIGTERM", "SIGBREAK"]) process.on(signal, () => {
  updater.stop();
});
await serve((await call({ action: "server", container: false })).server);
