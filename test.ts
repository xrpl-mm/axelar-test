import * as xrpl from "xrpl";
import abi from "ethereumjs-abi";
import { ethers } from "ethers";

async function run() {
  // Can always get a new one from https://xrpl.org/resources/dev-tools/xrp-faucets
  const SECRET = `sEdVcMacmexci3aaP8omKdgjSPUmmde`;
  const DESTINATION_CHAIN = "xrpl-evm-sidechain";
  // https://explorer.xrplevm.org/address/0x7b1bf875977e4124dc781153bd6393c8e1c22739
  const DESTINATION_EVM_ADDRESS_INTERCHAIN_TOKEN_EXECUTABLE = `7b1bf875977e4124dc781153bd6393c8e1c22739`;
  // https://explorer.xrplevm.org/address/0x2bd071fce9eb7f51333b002ea4adcbe61d9322a9
  const DESTINATION_EVM_ADDRESS_AXELAR_EXECUTABLE = `2bd071fce9eb7f51333b002ea4adcbe61d9322a9`;
  // https://explorer.xrplevm.org/address/0xc98869883ef7144d4cc84b3cc4b403cccd781a63
  const DESTINATION_EVM_ADDRESS_AXELAR_EXECUTABLE_WITH_TOKEN = `c98869883ef7144d4cc84b3cc4b403cccd781a63`;
  const MULTISIG = `rP9iHnCmJcVPtzCwYJjU1fryC2pEcVqDHv`;
  const AMOUNT = xrpl.xrpToDrops("2.32");
  const RPC_URL = "wss://s.devnet.rippletest.net:51233";

  const xrplWallet = xrpl.Wallet.fromSeed(SECRET);

  function createPayloadHash(payload: Buffer): string {
    return ethers.keccak256(payload).slice(2);
  }

  const payloadData = abi.rawEncode(
    ["bytes", "string"],
    ["0x1234", "a"],
  );

  // const wrappedPayloadHash = abi.rawEncode(
  //   ["string", "uint256", "bytes"],
  //   ["uxrp", AMOUNT, payloadData],
  // )

  const paymentTx: xrpl.Payment = {
    TransactionType: "Payment",
    Account: xrplWallet.address,
    Amount: AMOUNT,
    Fee: xrpl.xrpToDrops("1"),
    Destination: MULTISIG,
    SigningPubKey: xrplWallet.publicKey,
    SourceTag: 8989_8989,
    Memos: [
      {
        Memo: {
          MemoData: DESTINATION_EVM_ADDRESS_AXELAR_EXECUTABLE_WITH_TOKEN,
          MemoType: Buffer.from("destination_address")
            .toString("hex")
            .toUpperCase(),
        },
      },
      {
        Memo: {
          MemoData: Buffer.from(DESTINATION_CHAIN).toString("hex").toUpperCase(),
          MemoType: Buffer.from("destination_chain")
            .toString("hex")
            .toUpperCase(),
        },
      },
      {
        Memo: {
          MemoData: createPayloadHash(
            payloadData,
          ),
          MemoType: Buffer.from("payload_hash").toString("hex").toUpperCase(),
        },
      },
    ],
  };

  const provider = new xrpl.Client(RPC_URL);
  await provider.connect();
  const autoFilledTx = await provider.autofill(paymentTx);

  const signed = xrplWallet.sign(autoFilledTx);
  const txResponse = await provider.submitAndWait(signed.tx_blob, {
    wallet: xrplWallet,
  });

  console.log(txResponse)

  process.exit(0);
}

run().catch(console.error);
