// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

struct FreelancerProfile{
    uint256 id;
    string name;
    address wallet;
    uint8 experienceYears;
    bool isAvailableHire;
    uint256 hourlyRateWei; // 1 ether = 10^18 wei
}

struct EmployerProfile{
    uint256 id;
    string name;
    bool isHiring;
    address wallet;
}