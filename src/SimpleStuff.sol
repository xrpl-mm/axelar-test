// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {InterchainTokenExecutable} from "interchain-token-service/executable/InterchainTokenExecutable.sol";
import {InterchainTokenService} from "interchain-token-service/InterchainTokenService.sol";

contract SimpleStuff is InterchainTokenExecutable {
    event ExecuteWithInterchainToken(
        bytes32 commandId,
        string sourceChain,
        bytes sourceAddress,
        bytes data,
        bytes32 tokenId,
        address token,
        uint256 amount
    );
    event DecodedData(bytes destinationAddress, string message);

    uint256 public number;
    string constant DESTINATION_CHAIN = "xrpl";

    constructor(address _interchainTokenService) InterchainTokenExecutable(_interchainTokenService) {}

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }

    function receiveAndSendBack() public {
        increment();
    }

    function _executeWithInterchainToken(
        bytes32 commandId,
        string calldata sourceChain,
        bytes calldata sourceAddress,
        bytes calldata data,
        bytes32 tokenId,
        address token,
        uint256 amount
    ) internal virtual override {
        emit ExecuteWithInterchainToken(commandId, sourceChain, sourceAddress, data, tokenId, token, amount);

        (bytes memory destinationAddress, string memory message) = abi.decode(data, (bytes, string));

        emit DecodedData(destinationAddress, message);
        bytes memory num = abi.encodePacked(uint16(0x1234));
        bytes memory replyData = abi.encodePacked(num, "reply");

        InterchainTokenService(interchainTokenService).callContractWithInterchainToken(
            tokenId,
            DESTINATION_CHAIN,
            destinationAddress,
            amount / 2, // uint256 amount,
            replyData, // bytes memory data,
            0 // uint256 gasValue
        );
    }
}
