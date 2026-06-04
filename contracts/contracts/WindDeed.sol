// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract WindDeed {
    struct Deed { address owner; string title; string description; uint256 registeredAt; bool forSale; uint256 price; }
    Deed[] public deeds;
    mapping(address => uint256[]) public myDeeds;
    uint256 public constant regFee = 0;
    function register(string calldata title, string calldata description) external payable returns (uint256) {
        require(msg.value >= regFee, "pay fee");
        uint256 id = deeds.length;
        deeds.push(Deed(msg.sender, title, description, block.timestamp, false, 0));
        myDeeds[msg.sender].push(id); return id;
    }
    function listForSale(uint256 id, uint256 price) external {
        require(deeds[id].owner == msg.sender, "not owner");
        deeds[id].forSale = true; deeds[id].price = price;
    }
    function delist(uint256 id) external { require(deeds[id].owner == msg.sender); deeds[id].forSale = false; }
    function purchase(uint256 id) external payable {
        Deed storage d = deeds[id];
        require(d.forSale, "not for sale"); require(msg.value >= d.price, "insufficient");
        address prev = d.owner; d.owner = msg.sender; d.forSale = false;
        myDeeds[msg.sender].push(id); payable(prev).transfer(msg.value);
    }
    function getDeed(uint256 id) external view returns (Deed memory) { return deeds[id]; }
    function getMyDeeds(address user) external view returns (uint256[] memory) { return myDeeds[user]; }
    function totalDeeds() external view returns (uint256) { return deeds.length; }
}