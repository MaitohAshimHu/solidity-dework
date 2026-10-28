// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import{FreelancerProfile} from "./types/DeworkTypes.sol";
import{EmployerProfile} from "./types/DeworkTypes.sol";

contract Dework{
    uint256 connectFee;   //state variable  by default = 0
    address public initialOwner; //default 0x000000.....0   
    
    FreelancerProfile[] public freelancerProfiles;
    EmployerProfile[] public employerProfiles;

    mapping(uint256=>address) public freelancerIdToAddress;
    mapping(uint256=>address) public employerIdToAddress;

    //solidity has no concept of null / none

    constructor(address _initialOwner){
        initialOwner = _initialOwner;
    }

    function getNumberOfRegisteredFreelancers() public view returns(uint256) {
         return freelancerProfiles.length;
    }

    function getNumberOfRegisteredEmployers() public view returns(uint256){
        return employerProfiles.length;
    }

    function registerFreelancerProfile(
        string calldata name,
        uint8 experienceYears,
        uint8 hourlyRateWei
    ) external {
         uint256 freelancerId = getNumberOfRegisteredFreelancers();

         FreelancerProfile memory freelancerProfile = FreelancerProfile({
                   id:freelancerId,
                   name:name,
                   wallet: msg.sender,
                   experienceYears:experienceYears,
                   isAvailableHire:true,
                   hourlyRateWei:hourlyRateWei
         });
         freelancerProfiles.push(freelancerProfile);
         freelancerIdToAddress[freelancerId] =msg.sender;
    }

    function registerEmployerProfile(
        string calldata employerName
    ) external {
        uint256 employerId = getNumberOfRegisteredEmployers();
        EmployerProfile memory employerProfile = EmployerProfile({
                id:employerId,
                name:employerName,
                isHiring:true,
                wallet:msg.sender
        });
        employerProfiles.push(employerProfile);
        employerIdToAddress[employerId] =msg.sender;
    }

     function getFreelancerProfile() public view returns(FreelancerProfile[] memory){
               return freelancerProfiles;
     }

     function getEmployerProfile() public view returns(EmployerProfile[] memory){
               return employerProfiles;
     }


    //  function updateHourlyRate(uint256 _hourlyRate) public {
    //    hourlyRate = _hourlyRate;
    //  }
    //  function getHourlyRate() public view returns(uint256) {
    //     return hourlyRate;
    //  }


}