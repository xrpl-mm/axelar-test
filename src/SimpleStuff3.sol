// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AxelarExecutableWithToken} from "axelar-gmp-sdk-solidity/executable/AxelarExecutableWithToken.sol";
import {InterchainTokenService} from "interchain-token-service/InterchainTokenService.sol";

contract SimpleStuff3 is AxelarExecutableWithToken {
    event Executed(bytes32 commandId, string sourceChain, string sourceAddress, bytes payload);
    event Executed2(
        bytes32 commandId,
        string sourceChain,
        string sourceAddress,
        bytes payload,
        string tokenSymbol,
        uint256 amount
    );

    uint256 public number;
    string constant DESTINATION_CHAIN = "xrpl";

    constructor(address _gateway) AxelarExecutableWithToken(_gateway) {}
    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual override {
        emit Executed(commandId, sourceChain, sourceAddress, payload);
    }

    function _executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal virtual override {
        emit Executed2(commandId, sourceChain, sourceAddress, payload, tokenSymbol, amount);
    }
}
