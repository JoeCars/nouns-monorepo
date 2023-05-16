// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.15;

import { NounsTokenLike } from '../../../contracts/governance/NounsDAOInterfaces.sol';
import { INounsDescriptorMinimal } from '../../../contracts/interfaces/INounsDescriptorMinimal.sol';
import { INounsSeeder } from '../../../contracts/interfaces/INounsSeeder.sol';

contract NounsTokenLikeMock is NounsTokenLike {
    address public noundersDAO;
    INounsDescriptorMinimal public descriptor;
    INounsSeeder public seeder;
    mapping(address => mapping(uint256 => uint96)) priorVotes;

    function getPriorVotes(address account, uint256 blockNumber) external view returns (uint96) {
        return priorVotes[account][blockNumber];
    }

    function totalSupply() external pure returns (uint256) {
        return 0;
    }

    function setPriorVotes(
        address account,
        uint256 blockNumber,
        uint96 votes
    ) external {
        priorVotes[account][blockNumber] = votes;
    }

    function balanceOf(address) external pure returns (uint256 balance) {
        return 0;
    }

    function ownerOf(uint256) external pure returns (address owner) {
        return address(0);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external {
        // noop
    }

    function setNoundersDAO(address _noundersDAO) external {
        noundersDAO = _noundersDAO;
    }

    function mint() public pure returns (uint256) {
        return 0;
    }

    function minter() external pure returns (address) {
        return address(0);
    }
}
