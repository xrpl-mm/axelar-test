// Import necessary modules
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import { execSync } from "child_process";
import { decodeAccountID, dropsToXrp, encodeAccountID } from "xrpl";
import { ethers } from "ethers";

const KEYRING_DIR = `/Users/jm/Documents/Code/axelar-test/relayer/.axelar`;
const XRP_TOKEN_ID = `0xc2bb311dd03a93be4b74d3b4ab8612241c4dd1fd0232467c54a03b064f8583b6`;
const EVM_SIDECHAIN = "xrpl-evm-sidechain";
const XRPL = "xrpl";
const AXELARNET = "axelarnet";
const AXELARNET_GATEWAY = `axelar1yvfcrdke7fasxfaxx2r706h7h85rnk3w68cc5f4fkmafz5j755ssl8h9p0`;
const INTERCHAIN_TOKEN_SERVICE = `axelar10jzzmv5m7da7dn2xsfac0yqe7zamy34uedx3e28laq0p6f3f8dzqp649fp`;
const XRPL_AXELAR_GATEWAY = `rP9iHnCmJcVPtzCwYJjU1fryC2pEcVqDHv`;
const EVM_SIDECHAIN_MULTISIG_PROVER = `axelar19pu8hfnwgc0vjhadmvmgz3w4d2g7d7qlg6jjky9y2mf8ea4vf4usj6ramg`;

/**
 * Converts an XRPL account to an EVM address.
 * @param account The XRPL account to convert.
 * @returns The EVM address.
 */
export const xrplAccountToEvmAddress = (account: string): string => {
  const accountId = decodeAccountID(account);
  return `0x${Buffer.from(accountId).toString("hex")}`;
};

/**
 * Converts an EVM address to an XRPL account.
 * @param address The EVM address to convert.
 * @returns The XRPL account.
 */
export const evmAddressToXrplAccount = (address: string): string => {
  const accountId = Buffer.from(address.slice(2), "hex");
  return encodeAccountID(accountId);
};

export const uint8ArrToHex = (arr: number[]): string => {
  return arr.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

type Message = {
  tx_hash: string;
  source_address: string;
  destination_address: string;
  amount: string;
  payload_hash: string;
  payload: string;
};

type SerializedUserMessage = {
  tx_id: number[];
  source_address: number[];
  destination_chain: string;
  destination_address: string;
  amount: {
    drops: number;
  };
  payload_hash: string;
};

type RouteITSHubMessageOutput = {
  txhash: string,
  code: 0 | number,
}

type EventAttribute = { 
  key: string, 
  value: string 
}

type LoggedEvent = {
  type: string,
  attributes: Array<EventAttribute>
}

type UnfurledEvent = {
  sourceChain: string;
  sourceAddress: string;
  messageId: string;
  payload: string;
  payloadHash: string;
  destinationChain: string;
  destinationAddress: string;
}

type AxelarExecuteCommandOutput = {
  logs: {
    events: Array<LoggedEvent>
  }[]
}

function isRouteITSMessageOutput(output: any): output is RouteITSHubMessageOutput {
  return output.txhash !== undefined && output.code !== undefined &&
    typeof output.txhash === "string" && typeof output.code === "number"
  ;
}

function isAxelarExecuteCommandOutput(output: any): output is AxelarExecuteCommandOutput {
  return output.logs !== undefined && Array.isArray(output.logs)
}

function unfurlEvent(event: LoggedEvent): UnfurledEvent {
  const unfurled: UnfurledEvent = {
    sourceChain: "",
    sourceAddress: "",
    messageId: "",
    payload: "",
    payloadHash: "",
    destinationChain: "",
    destinationAddress: "",
  }

  for (const attr of event.attributes) {
    switch (attr.key) {
      case "destination_address":
        unfurled.destinationAddress = attr.value
        break
      case "destination_chain":
        unfurled.destinationChain = attr.value
        break
      case "message_id":
        unfurled.messageId = attr.value
        break
      case "payload":
        unfurled.payload = attr.value
        break
      case "payload_hash":
        unfurled.payloadHash = attr.value
        break
      case "source_address":
        unfurled.sourceAddress = attr.value
        break
      case "source_chain":
        unfurled.sourceChain = attr.value
        break
    }
  }

  // Check if any of the fields are empty
  for (const [key, value] of Object.entries(unfurled)) {
    if (value === "") {
      throw new Error(`Unfurled event is missing field: ${key}`)
    }
  }

  return unfurled
}

const readArtifact0 = (filePath: string): Message => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const message = JSON.parse(fileContent);

    if (
      !message.tx_hash ||
      !message.source_address ||
      !message.destination_address ||
      !message.amount ||
      !message.payload_hash ||
      !message.payload
    ) {
      throw new Error("File content is missing required fields");
    }

    return message;
  } catch (e) {
    const error = e as Error;
    throw new Error(`Error reading or parsing file: ${error.message}`);
  }
};

// Prepare the verify_messages JSON
const prepareVerifyMessages = (message: Message) => {
  const tx_id = Array.from(new Uint8Array(Buffer.from(message.tx_hash, "hex")));
  const sourceAddressHex = xrplAccountToEvmAddress(
    message.source_address
  ).slice(2);
  const source_address = Array.from(
    new Uint8Array(Buffer.from(sourceAddressHex, "hex"))
  );
  // {
  //     "userMessage": {
  //       "tx_id": [
  //         238,
  //         140,
  //         158,
  //         206,
  //         201,
  //         3,
  //         236,
  //         156,
  //         250,
  //         188,
  //         42,
  //         211,
  //         111,
  //         47,
  //         79,
  //         0,
  //         238,
  //         86,
  //         133,
  //         209,
  //         239,
  //         51,
  //         227,
  //         15,
  //         97,
  //         137,
  //         227,
  //         148,
  //         164,
  //         1,
  //         11,
  //         49
  //       ],
  //       "source_address": [
  //         100,
  //         193,
  //         111,
  //         231,
  //         167,
  //         20,
  //         155,
  //         203,
  //         57,
  //         13,
  //         62,
  //         175,
  //         92,
  //         15,
  //         81,
  //         217,
  //         35,
  //         106,
  //         65,
  //         96
  //       ],
  //       "destination_chain": "xrpl-evm-sidechain",
  //       "destination_address": "7b1bf875977e4124dc781153bd6393c8e1c22739",
  //       "amount": {
  //         "drops": 2050000
  //       },
  //       "payload_hash": "BA09F92F375483C1DD1425753053A187817F46B96AD6B1756E68347B7CD5B4E8"
  //     }
  //   }
  const user_message = {
    tx_id: tx_id,
    source_address: source_address,
    destination_chain: EVM_SIDECHAIN,
    destination_address: message.destination_address,
    amount: { drops: Number(message.amount) },
    payload_hash: message.payload_hash,
  };
  const verifyMessages = {
    verify_messages: [
      {
        user_message,
      },
    ],
  };
  return {
    str: JSON.stringify(verifyMessages),
    user_message,
    payloadHex: message.payload,
  };
};

// Execute axelard command
const verifyMessage = async (message: Message) => {
  const {
    str: verifyMessagesJson,
    user_message,
    payloadHex,
  } = prepareVerifyMessages(message);

  const command = `axelard tx wasm execute axelar13w698a6pjytxj6jzprs6pznaxhan3flhf76fr0nc7jg3udcsa07q9c7da3 '${verifyMessagesJson}' --keyring-backend test --from wallet --keyring-dir ${KEYRING_DIR} --gas 20000000 --gas-adjustment 1.5 --gas-prices 0.00005uamplifier --chain-id devnet-amplifier --node http://devnet-amplifier.axelar.dev:26657`;

  while (true) {
    try {
      console.log("Executing command:", command);
      const output = execSync(command, {
        env: {
          ...process.env,
          AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
        },
      }).toString();
      if (output.includes("wasm-already_verified")) {
        console.log("Verification completed.");
        break;
      } else {
        console.log("Waiting for verification to complete...");
      }
    } catch (e) {
      const error = e as Error;
      console.log(
        `Error: ${error.message}. Waiting for verification to complete...`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return { user_message, payloadHex };
};

const routeMessage = async ({
  // without 0x
  payloadHex,
  serializedUserMessage,
}: {
  payloadHex: string;
  serializedUserMessage: SerializedUserMessage;
}) => {
  const routeMessageCall = {
    route_incoming_messages: [
      {
        payload: payloadHex,
        message: {
          user_message: serializedUserMessage,
        },
      },
    ],
  };

  const command = `axelard tx wasm execute axelar13w698a6pjytxj6jzprs6pznaxhan3flhf76fr0nc7jg3udcsa07q9c7da3 '${JSON.stringify(
    routeMessageCall
  )}' --keyring-backend test --from wallet --keyring-dir ${KEYRING_DIR} --gas 20000000 --gas-adjustment 1.5 --gas-prices 0.00005uamplifier --chain-id devnet-amplifier --node http://devnet-amplifier.axelar.dev:26657`;

  while (true) {
    try {
      console.log("Executing command:", command);
      const output = execSync(command, {
        env: {
          ...process.env,
          AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
        },
      }).toString();

      if (output.includes("wasm-message_routed")) {
        console.log("Verification completed.");
        break;
      } else {
        console.log("Waiting for routing to complete...");
      }
    } catch (e) {
      const error = e as Error;
      console.log(
        `Error: ${error.message}. Waiting for routing to complete...`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("Routing completed.");
};

const executeItsHubMessage = async ({
  user_message,
  payloadHex,
}: {
  user_message: SerializedUserMessage;
  payloadHex: string;
}) => {
  const interchainTransfer = {
    messageType: ethers.BigNumber.from("0"),
    // Only XRP transfer is supported for now
    tokenId: XRP_TOKEN_ID,
    sourceAddress: `0x${uint8ArrToHex(user_message.source_address)}`,
    destinationAddress: `0x${user_message.destination_address}`,
    amount: ethers.utils.parseUnits(
      dropsToXrp(user_message.amount.drops).toString()
    ),
    data: `0x${payloadHex}`,
  };

  console.log({
    interchainTransfer: JSON.stringify(interchainTransfer, null, 2),
  });

  const abiCoder = new ethers.utils.AbiCoder();

  const messageEncoded = abiCoder.encode(
    ["uint256", "bytes32", "bytes", "bytes", "uint256", "bytes"],
    [
      interchainTransfer.messageType,
      interchainTransfer.tokenId,
      interchainTransfer.sourceAddress,
      interchainTransfer.destinationAddress,
      interchainTransfer.amount,
      interchainTransfer.data,
    ]
  );

  const hubMessage = abiCoder.encode(
    ["uint256", "string", "bytes"],
    [ethers.BigNumber.from("3"), EVM_SIDECHAIN, messageEncoded]
  );

  const txIdHex = uint8ArrToHex(user_message.tx_id);
  const messageId = `0x${txIdHex.toLowerCase()}-0`;

  const contractCall = {
    execute: {
      cc_id: {
        source_chain: XRPL,
        message_id: messageId,
      },
      payload: hubMessage.slice(2),
    },
  };

  console.log({ contractCall: JSON.stringify(contractCall, null, 2) });

  let loggedEvent: LoggedEvent | null = null;
  while (true) {
    try {
      const output = execSync(
        `axelard tx wasm execute ${AXELARNET_GATEWAY} '${JSON.stringify(
          contractCall
        )}' --keyring-backend test --from wallet --keyring-dir ${KEYRING_DIR} --gas 20000000 --gas-adjustment 1.5 --gas-prices 0.00005uamplifier --chain-id devnet-amplifier --node http://devnet-amplifier.axelar.dev:26657`,
        {
          env: {
            ...process.env,
            AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
          },
        }
      ).toString();

      const parsed = JSON.parse(output);

      if (output.includes("wasm-contract_called") && isAxelarExecuteCommandOutput(parsed)) {
        if (parsed.logs.length === 0) {
          console.log(`Empty logs after executing ITS Hub Message.`)
          continue
        } else {
          const [firstLog] = parsed.logs
          if (firstLog.events.length === 0) {
            console.log(`Empty events after executing ITS Hub Message.`)
            continue
          } else {
            const contractCalledEvent = firstLog.events.find(({ type }) => type === "wasm-contract_called")!

            loggedEvent = contractCalledEvent
          }
        }
        console.log("ITS Hub message executed.");
        break;
      } else {
        console.log("Waiting for ITS Hub message to be executed...");
      }
    } catch (e) {
      const error = e as Error;
      console.log(
        `Error: ${error.message}. Waiting for ITS Hub message to be executed`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const unfurled = unfurlEvent(loggedEvent!)

  console.log({ unfurled: JSON.stringify(unfurled, null, 2) });

  return { user_message, payloadHex, messageId, loggedEvent: unfurled };
};

const routeITSHubMessage = async ({
  messageId,
  payloadHash,
}: {
  messageId: string;
  payloadHash: string;
}) => {
  const routeMessages = {
    route_messages: [
      {
        cc_id: {
          source_chain: XRPL,
          message_id: messageId,
        },
        destination_chain: AXELARNET,
        destination_address: INTERCHAIN_TOKEN_SERVICE,
        source_address: XRPL_AXELAR_GATEWAY,
        payload_hash: payloadHash,
      },
    ],
  };

  console.log({ routeMessages: JSON.stringify(routeMessages, null, 2) });

  while (true) {
    try {
      const output = execSync(
        `axelard tx wasm execute ${AXELARNET_GATEWAY} '${JSON.stringify(
          routeMessages
        )}' --keyring-backend test --from wallet --keyring-dir ${KEYRING_DIR} --gas 20000000 --gas-adjustment 1.5 --gas-prices 0.00005uamplifier --chain-id devnet-amplifier --node http://devnet-amplifier.axelar.dev:26657`,
        {
          env: {
            ...process.env,
            AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
          },
        }
      ).toString();

      const parsed = JSON.parse(output);

      console.log(parsed)

      if (isRouteITSMessageOutput(parsed)) {
        if (parsed.code === 0) {
          console.log(`ITS Hub message route request submitted: ${parsed.txhash}`);
          break
        } else {
          console.log(`Error: ITS Hub message routing failed (code is not 0): ${JSON.stringify(parsed, null, 2)}`);
        }
      } else {
        console.log(`Error: parsed output is not a RouteITSMessageOutput: ${JSON.stringify(parsed, null, 2)}`);
      }
    } catch (e) {
      const error = e as Error;
      console.log(
        `Error: ${error.message}. Waiting for ITS Hub message to be routed`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

const constructTransferProof = async ({
  messageId,
}: {
  messageId: string;
}) => {
  const constructProofCall = {
    construct_proof: [
      {
        source_chain: AXELARNET,
        message_id: messageId,
      },
    ],
  };

  let loggedEvent: LoggedEvent | null = null;
  while (true) {
    try {
      const output = execSync(
        `axelard tx wasm execute ${EVM_SIDECHAIN_MULTISIG_PROVER} '${JSON.stringify(
          constructProofCall
        )}' --keyring-backend test --from wallet --keyring-dir ${KEYRING_DIR} --gas 20000000 --gas-adjustment 1.5 --gas-prices 0.00005uamplifier --chain-id devnet-amplifier --node http://devnet-amplifier.axelar.dev:26657`,
        {
          env: {
            ...process.env,
            AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
          },
        }
      ).toString();

      console.log({ output: JSON.stringify(output, null, 2) });
      const parsed = JSON.parse(output);

      if (output.includes("wasm-proof_under_construction") && isAxelarExecuteCommandOutput(parsed)) {
        if (parsed.logs.length === 0) {
          console.log(`Empty logs after executing ITS Hub Message.`)
          continue
        } else {
          const [firstLog] = parsed.logs
          if (firstLog.events.length === 0) {
            console.log(`Empty events after executing ITS Hub Message.`)
            continue
          } else {
            const contractCalledEvent = firstLog.events.find(({ type }) => type === "wasm-proof_under_construction")!

            loggedEvent = contractCalledEvent
          }
        }
        break;
      } else {
        console.log("Waiting for transfer proof to be constructed...");
      }
    } catch (e) {
      const error = e as Error;
      console.log(
        `Error: ${error.message}. Waiting for transfer proof to be constructed...`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const multisigSessionIdAttribute = loggedEvent!.attributes.find(({ key }) => key === "multisig_session_id")

  if (multisigSessionIdAttribute === undefined) {
    throw new Error(`Multisig session ID attribute not found in proof under construction event`)
  }

  const multisigSessionId = multisigSessionIdAttribute.value

  console.log(`Multisig session ID: ${multisigSessionId}`)

  return { multisigSessionId }
};

const getProof = async ({
  multisigSessionId,
}: {
  multisigSessionId: string;
}) => {
  const getProofCall = {
    proof: {
        multisig_session_id: multisigSessionId,
    },
  };

  while (true) {
    try {
      const output = execSync(
        `axelard q wasm contract-state smart ${EVM_SIDECHAIN_MULTISIG_PROVER} '${JSON.stringify(
          getProofCall
        )}' --output json --node http://devnet-amplifier.axelar.dev:26657`,
        {
          env: {
            ...process.env,
            AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
          },
        }
      ).toString();

      console.log({ output: JSON.stringify(output, null, 2) });
      // const parsed = JSON.parse(output);

      // if (output.includes("complted")) {
      //   break;
      // } else {
      //   console.log("Waiting for transfer proof to be constructed...");
      // }
    } catch (e) {
      const error = e as Error;
      console.log(
        `Error: ${error.message}. Waiting for the proof...`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

}

// CLI logic
const main = () => {
  const argv = yargs(hideBin(process.argv))
    .scriptName("relayer")
    .usage("$0 <command> [options]")
    .command(
      "xrpl-to-evm <artifact>",
      "Verify message from an artifact",
      (yargs) => {
        return yargs.positional("artifact", {
          describe: "Path to the file containing messages",
          type: "string",
          demandOption: true,
        });
      },
      async (argv) => {
        try {
          const message = readArtifact0(argv.artifact);
          const { payloadHex, user_message } = await verifyMessage(message);
          await routeMessage({
            payloadHex,
            serializedUserMessage: user_message,
          });
          const { loggedEvent } = await executeItsHubMessage({
            user_message,
            payloadHex,
          });
          await routeITSHubMessage({
            messageId: loggedEvent.messageId,
            payloadHash: user_message.payload_hash,
          });
          const { multisigSessionId } = await constructTransferProof({ messageId: loggedEvent.messageId });
          await getProof({ multisigSessionId });
        } catch (e) {
          const error = e as Error;
          console.error(error.message);
        }
      }
    )
    .demandCommand(1, "You need at least one command before moving on")
    .help()
    .alias("help", "h")
    .version()
    .alias("version", "v")
    .parse();
};

main();
