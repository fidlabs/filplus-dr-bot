// Create an async split point for webpack
// WebAssembly can't be included in initial chunk, this forces all the app into async chunk
import("./main");