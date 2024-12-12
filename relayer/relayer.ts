// Import necessary modules
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import { execSync } from 'child_process';
import { decodeAccountID, encodeAccountID } from "xrpl";

const KEYRING_DIR = `/Users/jm/Documents/Code/axelar-test/relayer/.axelar`

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
}

const readArtifact0 = (filePath: string): Message => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const message = JSON.parse(fileContent);

    if (
      !message.tx_hash ||
      !message.source_address ||
      !message.destination_address ||
      !message.amount ||
      !message.payload_hash ||
      !message.payload
    ) {
      throw new Error('File content is missing required fields');
    }

    return message;
  } catch (e) {
    const error = e as Error;
    throw new Error(`Error reading or parsing file: ${error.message}`);
  }
};

// Prepare the verify_messages JSON
const prepareVerifyMessages = (message: Message) => {
    const tx_id = Array.from(new Uint8Array(Buffer.from(message.tx_hash, "hex")))
    const sourceAddressHex = xrplAccountToEvmAddress(message.source_address).slice(2);
    const source_address = Array.from(new Uint8Array(Buffer.from(sourceAddressHex, "hex")))
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
    destination_chain: "xrpl-evm-sidechain",
    destination_address: message.destination_address,
    amount: { drops: Number(message.amount) },
    payload_hash: message.payload_hash,
  }
  const verifyMessages = {
    verify_messages: [
      {
        user_message,
      },
    ],
  };
  return { str: JSON.stringify(verifyMessages), user_message, payloadHex: message.payload };
};

// Execute axelard command
const verifyMessage = async (message: Message) => {
  const { str: verifyMessagesJson, user_message, payloadHex } = prepareVerifyMessages(message);

  const command = `axelard tx wasm execute axelar13w698a6pjytxj6jzprs6pznaxhan3flhf76fr0nc7jg3udcsa07q9c7da3 '${verifyMessagesJson}' --keyring-backend test --from wallet --keyring-dir ${KEYRING_DIR} --gas 20000000 --gas-adjustment 1.5 --gas-prices 0.00005uamplifier --chain-id devnet-amplifier --node http://devnet-amplifier.axelar.dev:26657`;

  while (true) {
    try {
      console.log('Executing command:', command);
      const output = execSync(command, { env: {
        ...process.env,
        AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
      } }).toString()
      if (output.includes("wasm-already_verified")) {
        console.log("Verification completed.")
        break
      } else {
        console.log("Waiting for verification to complete...")
      }
    } catch (e) {
      const error = e as Error;
      console.log(`Error: ${error.message}. Waiting for verification to complete...`)
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return { user_message, payloadHex };
};

const routeMessage = async ({
  // without 0x
  payloadHex,
  serializedUserMessage,
}: { payloadHex: string; serializedUserMessage: SerializedUserMessage }) => {
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

  const command = `axelard tx wasm execute axelar13w698a6pjytxj6jzprs6pznaxhan3flhf76fr0nc7jg3udcsa07q9c7da3 '${JSON.stringify(routeMessageCall)}' --keyring-backend test --from wallet --keyring-dir ${KEYRING_DIR} --gas 20000000 --gas-adjustment 1.5 --gas-prices 0.00005uamplifier --chain-id devnet-amplifier --node http://devnet-amplifier.axelar.dev:26657`;

  while (true) {
    try {
      console.log('Executing command:', command);
      const output = execSync(command, { env: {
        ...process.env,
        AXELARD_CHAIN_ID: `axelar-testnet-lisbon-3`,
      } }).toString()

      if (output.includes("wasm-message_routed")) {
        console.log("Verification completed.")
        break
      } else {
        console.log("Waiting for routing to complete...")
      }
    } catch (e) {
      const error = e as Error;
      console.log(`Error: ${error.message}. Waiting for routing to complete...`)
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("Routing completed.");
};

// CLI logic
const main = () => {
  const argv = yargs(hideBin(process.argv))
    .scriptName('relayer')
    .usage('$0 <command> [options]')
    .command(
      'verify-and-route-message <artifact>',
      'Verify message from an artifact',
      (yargs) => {
        return yargs.positional('artifact', {
          describe: 'Path to the file containing messages',
          type: 'string',
          demandOption: true,
        });
      },
      async (argv) => {
        try {
          const message = readArtifact0(argv.artifact);
          const { payloadHex, user_message } = await verifyMessage(message);
          await routeMessage({ payloadHex, serializedUserMessage: user_message });
        } catch (e) {
          const error = e as Error;
          console.error(error.message);
        }
      }
    )
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .parse();
};

main();
