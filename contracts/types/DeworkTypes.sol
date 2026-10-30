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
    JobListing[] jobListing;
}

struct CreateJobListingInput{
    string title;
    string jobDescription;
    uint256 deadlineTimestamp;
    uint256 fixedPriceInWei;
}

struct JobListing {
    uint256 id;
    string title;
    string description;
    uint256 deadlineTimestamp;
    bool isOpen;
    uint256 fixedPriceInWei;
    uint256 hiredFreelancerId;
    bool hasHiredFreelancer;
    bool isPaid;
}