// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UtilityPass is ERC721, Ownable {
    uint256 public nextId = 1;
    string public baseTokenURI;

    constructor(string memory name_, string memory symbol_, string memory baseURI_) 
        ERC721(name_, symbol_)
    {
        baseTokenURI = baseURI_;
    }

    function setBaseURI(string memory uri) external onlyOwner {
        baseTokenURI = uri;
    }

    function mintTo(address to) external onlyOwner returns (uint256 id) {
        id = nextId++;
        _safeMint(to, id);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}