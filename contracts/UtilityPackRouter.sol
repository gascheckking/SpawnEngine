// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Farcaster / Social Rewards Router
/// Lightweight, zero-treasury-risk reward layer.
/// Plug-in for: XP streaks, badges, creator tiers, etc.
contract UtilityPackRouter {
    address public owner;

    event BadgeGranted(address indexed to, bytes32 badgeId);
    event XpGranted(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice Change router owner (e.g., upgrade controller / governance)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero addr");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Give a badge for streaks, snipes, verified creator, etc.
    function grantBadge(address to, bytes32 badgeId) external onlyOwner {
        emit BadgeGranted(to, badgeId);
    }

    /// @notice Grant XP (for pulls, sales, trades, streaks, etc.)
    function grantXp(address to, uint256 amount) external onlyOwner {
        emit XpGranted(to, amount);
    }
}