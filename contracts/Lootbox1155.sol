// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Lootbox1155 — basic multi-token lootbox
 * - id 0 = lootbox token
 * - övriga ids = drops (cards, items, badges)
 */
contract Lootbox1155 is ERC1155, Ownable {
    uint256 public nextItemId = 1;

    constructor(string memory baseURI) ERC1155(baseURI) {}

    function mintLootbox(address to, uint256 amount) external onlyOwner {
        _mint(to, 0, amount, "");
    }

    function addItemAndMint(
        address to,
        uint256 amount
    ) external onlyOwner returns (uint256 itemId) {
        itemId = nextItemId++;
        _mint(to, itemId, amount, "");
    }

    // super enkel “open” — burn 1 lootbox, ge en itemId du bestämmer utanför
    function openLootbox(
        address account,
        uint256 itemId
    ) external onlyOwner {
        _burn(account, 0, 1);
        _mint(account, itemId, 1, "");
    }
}