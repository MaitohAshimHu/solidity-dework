// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.34;

import {Test} from "forge-std/Test.sol";
import {Dework} from "../src/Dework.sol";
import {FreelancerProfile,CreateJobListingInput,JobListing} from "../src/types/DeworkTypes.sol";
import "forge-std/console.sol";

contract DeworkTest is Test {
    Dework public dework;
    address initialOwner = makeAddr("owner");

    error Dework_UnauthorizedEmployer(uint256 employerId, address caller);

    function setUp() public {
        dework = new Dework(initialOwner);
    }

    function testOwnerIsInitialized() public view {
        address contractOwner = dework.owner();
        assertEq(initialOwner, contractOwner);
    }

    function testRegisterFreelancerProfile() public {
        //Arrange
        string memory name = "Ashim";
        uint8 experienceYears = 20;
        uint256 hourlyRateWei = 100;
        uint256 freelancerId = dework.getNumberOfRegisteredFreelancers();
        address freelancerAddr = makeAddr("freelancerAddr");

        //ACT
        vm.prank(freelancerAddr);
        dework.registerFreelancerProfile(name, experienceYears, hourlyRateWei);
        FreelancerProfile memory freelancer = dework.getFreelancerProfile(freelancerId);

        //ASSERT
        assertEq(freelancer.id, freelancerId);
        assertEq(freelancer.hourlyRateWei, hourlyRateWei);
        assertEq(freelancer.experienceYears, experienceYears);
        assertEq(freelancer.isAvailableHire, true);
        assertEq(freelancer.wallet, address(freelancerAddr));
    }

    function testCreateJobListingRevertsWhenEmployeeIsNotRegistered() public {
        address employer = makeAddr("employer");
        uint256 unregisteredEmployerId = 100;

        CreateJobListingInput memory jobListing = CreateJobListingInput({
            title: "Solidity Developer", jobDescription: "skilled worker", deadlineTimestamp: 100, fixedPriceInWei: 10
        });
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(Dework_UnauthorizedEmployer.selector, unregisteredEmployerId, employer));
        dework.createJobListing(unregisteredEmployerId, jobListing);
        }

    function testCreateJobListingRevertsWhenEmployeeIsRegistered() public {
        ///Arrange
        address employer = makeAddr("employer");
        address randomAddr = makeAddr("123");
        console.log(employer);
        vm.deal(employer,1 ether);
        console.log(employer.balance);
        vm.startPrank(employer);
        dework.registerEmployerProfile("Raju");
        uint256 employerIdRaju = 0;

        CreateJobListingInput memory jobListing = CreateJobListingInput({
            title: "Solidity Developer", jobDescription: "skilled worker", deadlineTimestamp: 100, fixedPriceInWei: 10
        });
        
        uint256 contractBeforeBlance = address(dework).balance;

        ///ACT
        dework.createJobListing{value:10}(employerIdRaju, jobListing);
        vm.stopPrank();

        uint256 contractAfterBalance = address(dework).balance;
        vm.prank(randomAddr);
        JobListing[] memory jobList = dework.getJobList(employerIdRaju);
        ///ASSERT
        assertEq(contractAfterBalance-contractBeforeBlance,10);
        assertEq(jobList[0].title,"Solidity Developer");
        assertEq(jobList[0].description,"skilled worker");
        assertEq(jobList[0].deadlineTimestamp, block.timestamp +100);
        assertEq(jobList[0].fixedPriceInWei,10);
        }


}
   
