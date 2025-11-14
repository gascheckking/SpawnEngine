// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Farcaster/social rewards router (no treasury risk).
contract UtilityPackRouter {
    address public owner;
    event BadgeGranted(address indexed to, bytes32 badgeId);
    event XpGranted(address indexed to, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor() { owner = msg.sender; }

    function grantBadge(address to, bytes32 badgeId) external onlyOwner {
        emit BadgeGranted(to, badgeId);
    }

    function grantXp(address to, uint256 amount) external onlyOwner {
        emit XpGranted(to, amount);
    }
}

