## 1. Timing foundation

- [x] 1.1 Add analysis performance, stage, runtime, and estimate types
- [x] 1.2 Add tested monotonic stage timing and throughput estimate helpers
- [x] 1.3 Instrument worker progress and completed reports without breaking old snapshots

## 2. Accelerated semantic pipeline

- [x] 2.1 Select WebGPU when supported and record the resolved runtime
- [x] 2.2 Add device-aware adaptive batches with bounded memory retry
- [x] 2.3 Fall back from GPU initialization or first-batch failure to the complete ordered WASM workload
- [x] 2.4 Verify candidate counts and ordering are invariant across batching paths

## 3. Waiting and completion experience

- [x] 3.1 Add the staged timing route to the archive progress view
- [x] 3.2 Keep timing visible beside the deterministic report while semantic work continues
- [x] 3.3 Add a distinct final end-to-end execution summary including model time, semantic time, runtime, batch size, and coverage
- [x] 3.4 Support accessible live updates, compact mobile composition, and reduced motion

## 4. Measurement and closure

- [x] 4.1 Benchmark the owner archive before and after under disclosed cache/runtime conditions
- [x] 4.2 Run targeted tests, full checks, strict OpenSpec validation, dependency audit, detector, and responsive browser review
- [x] 4.3 Complete the preserve-lane design receipt with zero unresolved P0/P1 findings
- [x] 4.4 Update PROJECT_STATUS.md and capability documentation, archive the change, commit, and push without deploying
