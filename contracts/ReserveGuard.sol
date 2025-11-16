// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal reserve guard: coverage for two mythic hits + buffer.
contract ReserveGuard {
    uint256 public mythicMult;     // e.g., 200e18 (scaled 1e18)
    uint256 public bufferBps;      // e.g., 1000 = +10%
    address public owner;

    event ParamsUpdated(uint256 mythicMult, uint256 bufferBps);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(uint256 _mythicMult, uint256 _bufferBps) {
        owner = msg.sender;
        mythicMult = _mythicMult;
        bufferBps = _bufferBps;
    }

    function setParams(uint256 _mythicMult, uint256 _bufferBps) external onlyOwner {
        mythicMult = _mythicMult;
        bufferBps = _bufferBps;
        emit ParamsUpdated(_mythicMult, _bufferBps);
    }

    function reserveRequired(uint256 packPrice, uint256 /*tokenUnit*/) public view returns (uint256) {
        uint256 base = (2 * mythicMult * packPrice) / 1e18;
        return base + (base * bufferBps) / 10_000;
    }

    function canOpen(uint256 escrowBalance, uint256 packPrice) external view returns (bool) {
        return escrowBalance >= reserveRequired(packPrice, 1);
    }
}
