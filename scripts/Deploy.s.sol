// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PharosInvadersGame.sol";

contract DeployPharosInvadersTournament is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Деплоим новый контракт турниров без ограничений лидерборда
        PharosInvadersTournament tournament = new PharosInvadersTournament();

        console.log("PharosInvadersTournament deployed to:", address(tournament));
        console.log("Contract owner:", tournament.owner());

        vm.stopBroadcast();
    }
}