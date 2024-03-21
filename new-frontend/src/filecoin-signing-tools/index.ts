import {ExtendedKey} from "@zondax/filecoin-signing-tools";
import {keyDeriveFromSeed} from '@zondax/filecoin-signing-tools/js';
import * as bip39 from 'bip39';

export function keyDerive(
	mnemonic: string,
	path: string,
	password: string | undefined,
): typeof ExtendedKey {
	if (password === undefined) {
		throw new Error(
			"'password' argument must be of type string or an instance of Buffer or ArrayBuffer. Received undefined",
		);
	}

	const seed = bip39.mnemonicToSeedSync(mnemonic, password);
	return keyDeriveFromSeed(seed, path);
}
