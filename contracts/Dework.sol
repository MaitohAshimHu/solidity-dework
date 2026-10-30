// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import{FreelancerProfile} from "./types/DeworkTypes.sol";
import{EmployerProfile} from "./types/DeworkTypes.sol";
import{CreateJobListingInput} from "./types/DeworkTypes.sol";
import{JobListing} from "./types/DeworkTypes.sol";

contract Dework{
    uint256 connectFee;   //state variable  by default = 0
    address public initialOwner; //default 0x000000.....0   
    //solidity has no concept of null / none

    
    FreelancerProfile[] public freelancerProfiles;
    EmployerProfile[] public employerProfiles;

    mapping(uint256=>address) public freelancerIdToAddress;
    mapping(uint256=>address) public employerIdToAddress;

    event FreelancerProfileRegistered(uint256 freelancerId,address caller);
    event EmployerProfileRegistered(uint256 employerId,address caller);   

    error Dework_IncorrectJobCreationFee(uint256 fixedPrice,uint256 pricePaid); 
    error Dework_JobClosed(uint256 jobId);
    error Dework_UnauthorizedEmployer(uint256 employerId,address caller);
    error Dework_UnauthorizedFreelancer(uint256 freelancerId,address caller);
    error Dework_InvalidJobId(uint256 employerId,uint256 jobId);

    constructor(address _initialOwner){
        initialOwner = _initialOwner;
    }

    modifier onlyAuthorizedEmployer(uint256 employerId) {
        address employer = employerIdToAddress[employerId];
        if (employer!=msg.sender || employer==address(0)){
                revert Dework_UnauthorizedEmployer(employerId,msg.sender);
            }
            _;
            }

    function getFreelancerProfile() public view returns(FreelancerProfile[] memory){
               return freelancerProfiles;
     }

    function getNumberOfRegisteredFreelancers() public view returns(uint256) {
         return freelancerProfiles.length;
    }

    function getEmployerProfile() public view returns(EmployerProfile[] memory){
               return employerProfiles;
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

         emit FreelancerProfileRegistered(freelancerId,msg.sender);
    }

    function registerEmployerProfile(
        string calldata employerName
    ) external {
        uint256 employerId = getNumberOfRegisteredEmployers();
        EmployerProfile memory employerProfile = EmployerProfile({
                id:employerId,
                name:employerName,
                isHiring:true,
                wallet:msg.sender,
                jobListing: new JobListing[](0)
        });
        employerProfiles.push(employerProfile);
        employerIdToAddress[employerId] =msg.sender;

        emit EmployerProfileRegistered(employerId,msg.sender);
    }
    
    function getNumberOfCreatedJobList(uint256 employerId) public view returns(uint256){
          return employerProfiles[employerId].jobListing.length;
    }

    function _getEmployerProfile(uint256 employerId) internal view returns(EmployerProfile storage){
        return employerProfiles[employerId];
    } 

    function createJobListing(
        uint256 employerId,
        CreateJobListingInput calldata jobListingInput
    )external payable
    onlyAuthorizedEmployer(employerId)
    {
            uint256 fixedPriceForJob = jobListingInput.fixedPriceInWei;

            if(msg.value != fixedPriceForJob){
                revert Dework_IncorrectJobCreationFee(fixedPriceForJob,msg.value);

            }

            EmployerProfile storage employerProfile = _getEmployerProfile(employerId);
            uint256 jobId = getNumberOfCreatedJobList(employerId);

        JobListing memory newJob = JobListing({
            id:jobId,
            title:jobListingInput.title,
            description:jobListingInput.jobDescription,
            deadlineTimestamp: block.timestamp+jobListingInput.deadlineTimestamp,
            isOpen:true,
            fixedPriceInWei:jobListingInput.fixedPriceInWei,
            hiredFreelancerId:0,
            hasHiredFreelancer:false,
            isPaid:false
        });

        employerProfile.jobListing.push(newJob);

    }    

    function _requireJobIsOpen(JobListing memory job) internal pure {
        if (job.isOpen != true){
            revert Dework_JobClosed(job.id);
        }
    }

     function _getJob(uint256 employerId,uint256 jobId)internal view returns(JobListing storage){
        return employerProfiles[employerId].jobListing[jobId];
    }

    function getJobList(uint256 employerId) external view returns(JobListing[] memory){
        return employerProfiles[employerId].jobListing;
    }

    function hireFreelancer(uint256 employerId,uint256 freelancerId,uint256 jobId) 
    public 
    onlyAuthorizedEmployer(employerId)
     {
            if (freelancerId>=getNumberOfRegisteredFreelancers() || freelancerIdToAddress[freelancerId] ==address(0)){
                revert Dework_UnauthorizedFreelancer(freelancerId,msg.sender);
            }
            if (jobId>=getNumberOfCreatedJobList(employerId)){
                revert Dework_InvalidJobId(employerId,jobId);
            }

          JobListing storage job = _getJob(employerId,jobId);
          _requireJobIsOpen(job);
          job.hiredFreelancerId = freelancerId;
          job.hasHiredFreelancer = true;
          job.isOpen = false;
    }


}