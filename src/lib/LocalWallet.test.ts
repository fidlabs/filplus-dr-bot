import assert from 'assert/strict';
import { LocalWallet } from "./LocalWallet.js";

const mnemonic = "olive bronze betray mixture involve path little annual device reject cattle agree"
const client = "t01010";
const amount = BigInt(100);

const wallet = new LocalWallet(mnemonic);
const notary1 = wallet.getAddress(0);
const sig1 = wallet.signRemoveDataCapProposal(0, client, amount);
const notary2 = wallet.getAddress(1);
const sig2 = wallet.signRemoveDataCapProposal(1, client, amount);

assert.equal(notary1, "f1ynb7mufokb2x33ot4ra22iqvl3xznvd6w6tpe7i");
assert.equal(notary2, "f1rbvmgghq7ty2hsmf3qmusszos77p22phy6bhtja");

assert.equal(sig1, "01d26e20e7fdcaba32cdfa1787ba666cd562b0b2605b62e4f8bc79dab4dd71836049b15ff63b6aa0d89c082589c3db63469dd11d2684279085ce5f2e9134c7ea9e00");
assert.equal(sig2, "01b1fb62a3e4057d098374cb31dc739dfdeae7bc166b3ccfbf72cf005161396f383f176ff8d706b88d51b1d49cfcc16f60963e2d6185a6e583899409a0025acf1100");