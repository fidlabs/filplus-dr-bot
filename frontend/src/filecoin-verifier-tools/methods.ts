// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import cbor from 'cbor';
import * as hamt from './hamt';
import blake from 'blakejs';
import * as address from '@glif/filecoin-address';
import {CID} from 'multiformats/cid';
import {identity} from 'multiformats/hashes/identity';
import * as rawFormat from 'multiformats/codecs/raw';
import {transactionSerialize} from '@zondax/filecoin-signing-tools';
import {LotusMessage} from '../types/TransactionRaw';
import {generateSignedMessage} from '../functions/generateSignMessage';

function cborEncode(...obj) {
	const enc = new cbor.Encoder();
	enc.addSemanticType(Buffer, enc._pushBuffer);
	return enc._encodeAll(obj);
}

function make(testnet) {
	function bytesToAddress(payload) {
		const addr = new address.Address(payload);
		return address.encode(testnet ? 't' : 'f', addr);
	}

	function addressAsBytes(str) {
		const nfs = address.newFromString(str);
		const res = Buffer.from(nfs.str, 'binary');
		return res;
	}

	const lotusNodeCode = process.env.FILECOIN_COIN_TYPE;
	async function signTx(client, indexAccount, walletContext, tx, address) {
		await client.chainHead();
		const nonce = await client.mpoolGetNonce(address);
		const filecoinMessage: LotusMessage = {
			To: tx.to,
			From: address,
			Nonce: nonce,
			Value: tx.value.toString() || '0',
			GasLimit: 2000000000, // FIXME should estimate
			GasFeeCap: '10000000', // FIXME ?? cli uses much lower value
			GasPremium: '10000000', // FIXME ?? cli uses much lower value
			Method: tx.method,
			Params: Buffer.from(tx.params, 'hex').toString('base64'),
		};

		const serializedMessage = transactionSerialize(filecoinMessage);

		// FIXME add handleErrors
		const signature = await walletContext.sign(
			`m/44'/${lotusNodeCode}'/0'/0/${indexAccount}`,
			Buffer.from(serializedMessage, 'hex'),
		);

		return generateSignedMessage(filecoinMessage, signature);
	}

	// returns tx hash
	async function sendTx(client, indexAccount, walletContext, obj, address) {
		const tx = await signTx(client, indexAccount, walletContext, obj, address);

		return await client.mpoolPush(tx);
	}

	async function getReceipt(client, id) {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const res = await client.stateSearchMsg({'/': id});
			if (res && res.Receipt) {
				return res.Receipt;
			}
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});
		}
	}

	async function getMessage(client, cid) {
		try {
			const res = await client.chainGetMessage({'/': cid});
			return res;
		} catch (error) {
			console.error(error)
		}
	}

	async function stateWaitMsg(client, cid) {
		try {
			const res = await client.stateWaitMsg({'/': cid}, 1);
			return res;
		} catch (error) {
			console.error(error)
		}
	}

	function pad(str) {
		if (str.length % 2 === 0) return str;
		else return '0' + str;
	}

	function encodeBig(bn) {
		if (bn.toString() === '0') return Buffer.from('');
		return Buffer.from('00' + pad(bn.toString(16)), 'hex');
	}

	function encodeBigKey(bn) {
		if (bn.toString() === '0') return Buffer.from('');
		return Buffer.from(pad(bn.toString(16)), 'hex');
	}

	function encodeSend(to, params = '') {
		return {
			to,
			method: 0,
			params: params ? cborEncode(params) : '',
			value: 0n,
		};
	}

	const VERIFREG = testnet ? 't06' : 'f06';
	const INIT_ACTOR = testnet ? 't01' : 'f01';
	const ROOTKEY = testnet ? 't080' : 'f080';

	function encodeApprove(msig, txid, from, msg) {
		const hashData = encodeProposalHashdata(from, msg);
		const hash = blake.blake2bHex(hashData, null, 32);
		return {
			to: msig,
			method: 3,
			params: cborEncode([txid, Buffer.from(hash, 'hex')]),
			value: 0n,
		};
	}

	function isType(schema) {
		if (
			schema === 'address' ||
			schema === 'bigint' ||
			schema === 'int' ||
			schema === 'buffer'
		)
			return true;
		if (schema instanceof Array) {
			if (schema[0] === 'list' || schema[0] === 'cbor') return true;
		}
		return false;
	}

	function decode(schema, data) {
		if (schema === 'address' && typeof data === 'string') {
			return bytesToAddress(Buffer.from(data, 'base64'), true);
		}
		if (schema === 'address' && data['/']) {
			return bytesToAddress(Buffer.from(data['/'].bytes, 'base64'), true);
		}
		if (schema === 'address') {
			return bytesToAddress(data, true);
		}
		if (schema === 'bigint' && typeof data === 'string') {
			return hamt.bytesToBig(Buffer.from(data, 'base64'));
		}
		if (schema === 'bigint' && data['/']) {
			return hamt.bytesToBig(Buffer.from(data['/'].bytes, 'base64'));
		}
		if (schema === 'bigint') {
			return hamt.bytesToBig(data);
		}
		if (schema === 'bigint-signed') {
			return hamt.bytesToBig(data) / 2n;
		}
		if (schema === 'bigint-key') {
			return hamt.readVarInt(data) / 2n;
		}
		if (schema === 'int' || schema === 'buffer' || schema === 'bool') {
			return data;
		}
		if (schema === 'cid' && data instanceof cbor.Tagged && data.tag === 42) {
			return new CID(data.value.slice(1));
		}
		if (schema === 'cid') {
			return data['/'];
		}
		if (schema.type === 'hash') {
			return data;
		}
		if (schema.type === 'hamt') {
			return {
				find: async (lookup, key) => {
					const res = await hamt.find(data, lookup, encode(schema.key, key));
					return decode(schema.value, res);
				},
				asList: async (lookup) => {
					const res = [];
					await hamt.forEach(data, lookup, async (k, v) => {
						res.push([decode(schema.key, k), decode(schema.value, v)]);
					});
					return res;
				},
				asObject: async (lookup) => {
					const res = {};
					await hamt.forEach(data, lookup, async (k, v) => {
						res[decode(schema.key, k)] = decode(schema.value, v);
					});
					return res;
				},
			};
		}
		if (schema instanceof Array) {
			if (schema[0] === 'list') {
				return data.map((a) => decode(schema[1], a));
			}
			if (schema[0] === 'ref') {
				return async (load) => decode(schema[1], await load(data['/']));
			}
			if (schema[0] === 'cbor') {
				return decode(schema[1], cbor.decode(data));
			}
			if (schema.length !== data.length)
				throw new Error('schema and data length do not match');
			if (isType(schema[0])) {
				const res = [];
				for (let i = 0; i < data.length; i++) {
					res.push(decode(schema[i], data[i]));
				}
				return res;
			}
			const res = {};
			for (let i = 0; i < data.length; i++) {
				res[schema[i][0]] = decode(schema[i][1], data[i]);
			}
			return res;
		}
		if (typeof schema === 'object') {
			const res = {};
			const entries = Object.entries(schema);
			for (let i = 0; i < entries.length; i++) {
				res[entries[i][0]] = decode(entries[i][1], data[i]);
			}
			return res;
		}
		throw new Error(`Unknown type ${schema}`);
	}

	function encode(schema, data) {
		if (schema === 'address') {
			return addressAsBytes(data).buffer;
		}
		if (schema === 'bigint') {
			return encodeBig(data).buffer;
		}
		if (schema === 'bigint-signed') {
			return encodeBigKey(data).buffer;
		}
		if (schema === 'bigint-key') {
			return encodeBigKey(data);
		}
		if (schema === 'int' || typeof data === 'string') {
			return parseInt(data);
		}
		if (schema === 'int' || schema === 'buffer') {
			return data.buffer ?? data;
		}
		if (schema === 'cid') {
			return new cbor.Tagged(42, Buffer.concat([Buffer.from([0]), data.bytes]));
		}
		if (schema === 'bool') {
			return data;
		}
		if (schema.type === 'hash') {
			const hashData = cborEncode(encode(schema.input, data));
			const hash = blake.blake2bHex(hashData, null, 32);
			return Buffer.from(hash, 'hex').buffer;
		}
		if (schema instanceof Array) {
			if (schema[0] === 'list') {
				return data.map((a) => encode(schema[1], a));
			}
			if (schema[0] === 'cbor') {
				return cborEncode(encode(schema[1], data));
			}
			if (schema.length !== data.length)
				throw new Error('schema and data length do not match');
			const res = [];
			for (let i = 0; i < data.length; i++) {
				res.push(encode(schema[i], data[i]));
			}
			return res;
		}
		if (typeof schema === 'object') {
			const res = [];
			const entries = Object.entries(schema);
			for (let i = 0; i < entries.length; i++) {
				let arg;
				if (data instanceof Array) {
					arg = data[i];
				} else {
					arg = data[entries[i][0]];
				}
				res.push(encode(entries[i][1], arg));
			}
			return res;
		}
		throw new Error(`Unknown type ${schema}`);
	}

	function actor(address, spec) {
		const res = {};
		for (const [num, method] of Object.entries(spec)) {
			res[method.name] = function (data) {
				let params;
				if (arguments.length > 1) {
					// eslint-disable-next-line prefer-rest-params
					params = encode(method.input, Array.from(arguments));
				} else {
					params = encode(method.input, data);
				}
				return {
					to: address,
					value: 0n,
					method: parseInt(num),
					params: cborEncode(params),
				};
			};
		}
		return res;
	}

	const multisig = {
		3: {
			name: 'approve',
			input: {
				id: 'int',
				hash: {
					type: 'hash',
					input: {
						from: 'address',
						to: 'address',
						value: 'bigint',
						method: 'int',
						params: 'buffer',
					},
				},
			},
		},
		2: {
			name: 'propose',
			input: {
				to: 'address',
				value: 'bigint',
				method: 'int',
				params: 'buffer',
			},
		},
		4: {
			name: 'cancel',
			input: {
				id: 'int',
				hash: {
					type: 'hash',
					input: {
						from: 'address',
						to: 'address',
						value: 'bigint',
						method: 'int',
						params: 'buffer',
					},
				},
			},
		},
		5: {
			name: 'addSigner',
			input: {
				signer: 'address',
				increase: 'bool',
			},
		},
		6: {
			name: 'removeSigner',
			input: {
				signer: 'address',
				decrease: 'bool',
			},
		},
		7: {
			name: 'swapSigner',
			input: {
				from: 'address',
				to: 'address',
			},
		},
		8: {
			name: 'changeNumApprovalsThreshold',
			input: {
				newThreshold: 'int',
			},
		},
	};

	const init = {
		2: {
			name: 'exec',
			input: {
				cid: 'cid',
				params: 'buffer',
			},
		},
	};

	const msig_constructor = [
		'cbor',
		{
			signers: ['list', 'address'],
			threshold: 'int',
			unlockDuration: 'int',
			startEpoch: 'int',
		},
	];

	const pending = {
		type: 'hamt',
		key: 'bigint-key',
		value: {
			to: 'address',
			value: 'bigint',
			method: 'int',
			params: 'buffer',
			signers: ['list', 'address'],
		},
	};

	const msig_state = {
		signers: ['list', 'address'],
		threshold: 'int',
		next_txn_id: 'int',
		initial_balance: 'bigint',
		start_epoch: 'int',
		unlock_duration: 'int',
		pending: ['ref', pending],
	};

	const verifreg = {
		2: {
			name: 'addVerifier',
			input: {
				verifier: 'address',
				cap: 'bigint',
			},
		},
		3: {
			name: 'removeVerifier',
			input: 'address',
		},
		4: {
			name: 'addVerifiedClient',
			input: {
				address: 'address',
				cap: 'bigint',
			},
		},
		7: {
			name: 'removeVerifiedClientDataCap',
			input: {
				verifiedClientToRemove: 'address',
				dataCapAmountToRemove: 'bigint',
				verifierRequest1: {
					verifier: 'address',
					signature: 'bigint-signed',
				},
				verifierRequest2: {
					verifier: 'address',
					signature: 'bigint-signed',
				},
			},
		},
	};

	const table = {
		type: 'hamt',
		key: 'address',
		value: 'bigint',
	};

	const verifreg_state = {
		rootkey: 'address',
		verifiers: ['ref', table],
		clients: ['ref', table],
	};

	const REMOVE_DATACAP_PROPOSAL = [
		'cbor',
		[
			'address', // verifiedClient
			'bigint', // dataCapAmount
			['list', 'int'], // removalProposalID
		],
	];

	const reg = {
		t080: multisig,
		t06: verifreg,
		t01: init,
		f080: multisig,
		f06: verifreg,
		f01: init,
	};

	function parse(tx) {
		try {
			const actor = reg[tx.to] || multisig;
			const {name, input} = actor[tx.method];
			const params = decode(input, cbor.decode(tx.params));
			return {name, params, parsed: params && parse(params)};
		} catch (err) {
			return null;
		}
	}

	const getMultisigCID = async () => {
		const bytes = rawFormat.encode('fil/7/multisig');
		const hash = await identity.digest(bytes);
		const multisigCID = CID.create(1, rawFormat.code, hash);

		return multisigCID;
	};

	// const multisigCID =  CID.create(
	//     1,
	//     0x55, //raw
	//     multihashes.encode(Buffer.from("fil/7/multisig"), "identity") //0x00
	// );

	async function buildArrayData(data, load) {
		const dataArray = [];
		await hamt.forEach(data, load, function (k, v) {
			dataArray.push([bytesToAddress(k), hamt.bytesToBig(v)]);
		});
		return dataArray;
	}

	return {
		encodeSend,
		encodeApprove,
		sendTx,
		signTx,
		decode,
		encode,
		actor,
		getReceipt,
		getMessage,
		stateWaitMsg,
		multisig,
		getMultisigCID,
		pending,
		rootkey: actor(ROOTKEY, multisig),
		verifreg: actor(VERIFREG, verifreg),
		init: actor(INIT_ACTOR, init),
		msig_constructor,
		msig_state,
		verifreg_state,
		parse,
		buildArrayData,
		ROOTKEY,
		VERIFREG,
		INIT_ACTOR,
		RemoveDataCapProposal: REMOVE_DATACAP_PROPOSAL,
	};
}

export const methods = {
	mainnet: make(false),
	testnet: make(true),
};
