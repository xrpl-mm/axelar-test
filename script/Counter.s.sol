// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SimpleStuff} from "../src/SimpleStuff.sol";

contract CounterScript is Script {
    SimpleStuff public simpleStuff;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        simpleStuff = new SimpleStuff();

        vm.stopBroadcast();
    }
}
