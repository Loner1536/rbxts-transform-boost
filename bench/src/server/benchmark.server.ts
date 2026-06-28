import * as base from "../shared/fns-bare";
import * as opt from "../shared/fns";

function bench(label: string, n: number, fn: () => void): void {
  // warmup
  for (let i = 0; i < math.max(100, n / 100); i++) fn();
  task.wait(0.05);
  const t0 = os.clock();
  for (let i = 0; i < n; i++) fn();
  const elapsed = os.clock() - t0;
  print(`  ${label}: ${string.format("%.3f", (elapsed / n) * 1e6)} us/iter`);
}

const N = 100000;
const NS = 10000;

const pos = new Vector3(1, 2, 3);
const vel = new Vector3(0, 1, 0);
const acc = new Vector3(0, -9.8, 0);
const vecA = new Vector3(1, 0, 0);
const vecB = new Vector3(0, 1, 0);
const eye = new Vector3(0, 5, 10);
const tgt = new Vector3(0, 0, 0);
const cf = CFrame.lookAt(eye, tgt);
const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const wts = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const cam = game.GetService("Workspace").CurrentCamera!;

function runSuite(fns: typeof opt): void {
  print("  -- GetService hoisting");
  bench("svc ×1 (baseline)       ", N, () => fns.svc1());
  bench("svc ×2 (same service)   ", N, () => fns.svc2());
  bench("svc ×3 (diff services)  ", N, () => fns.svc3());

  print("  -- Property chain caching");
  bench("cam.CFrame ×3           ", N, () => fns.camChain(cam));
  bench("cam.CFrame.Position ×3  ", N, () => fns.camDeep(cam));

  print("  -- Vector3 field hoisting");
  bench("dot    (×1 each field)  ", N, () => fns.dot(vecA, vecB));
  bench("cross  (×2 each field)  ", N, () => fns.cross(vecA, vecB));
  bench("lerp   (×2 each field)  ", N, () => fns.lerpVec3(pos, eye, 0.5));
  bench("integrate (method calls) ", N, () =>
    fns.integrate(pos, vel, acc, 1 / 60),
  );

  print("  -- Loop bounds hoisting");
  bench("sumArray   (size ×1)    ", N, () => fns.sumArray(vals));
  bench("weightedSum(size ×1)    ", N, () => fns.weightedSum(vals, wts));

  print("  -- CFrame");
  bench("cfLookAt (ctor)         ", NS, () => fns.cfLookAt(eye, tgt));
  bench("cfChain  (mul+angles)   ", N, () => fns.cfChain(cf, 0.016));
}

print("\n=== WITH transformer (hoisting + const + type annotations) ===");
runSuite(opt);
print("==============================================================\n");

task.wait(1);

print("\n=== WITHOUT transformer (raw roblox-ts output) ===");
runSuite(base);
print("==================================================\n");
