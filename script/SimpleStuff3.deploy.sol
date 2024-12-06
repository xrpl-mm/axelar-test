// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SimpleStuff3} from "../src/SimpleStuff3.sol";

contract CounterScript is Script {
    SimpleStuff3 public simpleStuff;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        simpleStuff = new SimpleStuff3(address(0x48CF6E93C4C1b014F719Db2aeF049AA86A255fE2));

        vm.stopBroadcast();
    }
}
