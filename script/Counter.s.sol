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

        simpleStuff = new SimpleStuff(address(0x43F2ccD4E27099b5F580895b44eAcC866e5F7Bb1));

        vm.stopBroadcast();
    }
}
