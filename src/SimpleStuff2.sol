// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AxelarExecutable} from "axelar-gmp-sdk-solidity/executable/AxelarExecutable.sol";
import {InterchainTokenService} from "interchain-token-service/InterchainTokenService.sol";

contract SimpleStuff2 is AxelarExecutable {
    event Executed(bytes32 commandId, string sourceChain, string sourceAddress, bytes payload);

    uint256 public number;
    string constant DESTINATION_CHAIN = "xrpl";

    constructor(
        address _gateway
    ) AxelarExecutable(_gateway) {}

    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual override {
        emit Executed(commandId, sourceChain, sourceAddress, payload);
    }
}
