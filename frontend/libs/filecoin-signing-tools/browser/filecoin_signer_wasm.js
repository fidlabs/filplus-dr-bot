import * as wasm from "./filecoin_signer_wasm_bg.wasm";
import { __wbg_set_wasm } from "./filecoin_signer_wasm_bg.js";
__wbg_set_wasm(wasm);
export * from "./filecoin_signer_wasm_bg.js";
