// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * SpawnRewardToken — XP / reward token for collectors
 * - Owner (t.ex. UtilityPackRouter eller din admin) kan mint:a
 */
contract SpawnRewardToken is ERC20, Ownable {
    constructor() ERC20("SpawnEngine Reward", "SPAWNXP") {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}