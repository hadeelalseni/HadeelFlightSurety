//pragma solidity ^0.4.25;
pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyApp {
    using SafeMath for uint256;
    using SafeMath for uint;
    FlightSuretyData flightSuretyData;

    /********************************************************************************************/
    /*                                       AIRLINE STUFF                                      */
    /********************************************************************************************/
    function registerAirline(address airlineToBeRegistered)external requireIsOperational{
        require(flightSuretyData.isRegisteredAirlineFunc(msg.sender), "If you want to register other, first register yourself :O");
        require(flightSuretyData.isFundedAirlineFunc(msg.sender), "If you want to register other, first you havee to fund with 10 ether.");
        uint256 h = flightSuretyData.getAirlinesCounter();
        uint256 h2 = 4;
        if( h > h2 ){ // by voting

            uint fundedCount = flightSuretyData.getFundedAirlinesCounter();
            uint votesCount = flightSuretyData.getAirlineVotesCount(airlineToBeRegistered);

            // calculate mod
            uint x = fundedCount.div(2);
            uint y = x.mul(2);
            uint z = fundedCount.sub(y);
            // 50%
            uint requiredVotes = fundedCount.mul(50).div(100).add(z);

            require(votesCount > requiredVotes, "You have to be voted by other airlines to get registered in the system.");

            //flightSuretyData.registerAirline(airlineToBeRegistered);
            flightSuretyData.registerAirline(airlineToBeRegistered, msg.sender);

            //success = true;
            //votes = votesCount;


        }else{
            //flightSuretyData.registerAirline(airlineToBeRegistered);
            flightSuretyData.registerAirline(airlineToBeRegistered, msg.sender);
            //success = true; // :)
            //votes = 0;
        }
        //return (success);
    }


    /********************************************************************************************/
    /*                                       FLIGHT STUFF                                       */
    /********************************************************************************************/
    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;    

    /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(address airline, string memory flightId, uint256 timestamp, uint8 statusCode) internal{
        if(statusCode == STATUS_CODE_LATE_AIRLINE){
            bytes32 insuranceKey = flightSuretyData.getInsuranceKey(airline, flightId, timestamp);
            flightSuretyData.creditInsurees(insuranceKey);
            //bytes32 flightKey = getFlightKey(airline, flight,timestamp);
            //flightSuretyData.creditInsurees(flightKey);
        }
    }
    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(address airline, string calldata flight, uint256 timestamp) external{
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({requester: msg.sender, isOpen: true });

        emit OracleRequest(index, airline, flight, timestamp);
    } 
    function registerFlight(uint8 statusCode, uint256 updatedTimestamp, address airline, string calldata flightId) external{
        flightSuretyData.registerFlight(statusCode, updatedTimestamp, airline, flightId);
    }

    /********************************************************************************************/
    /*                                       INSURANCE STUFF                                    */
    /********************************************************************************************/
    function buyInsurance(address payable airline, address passenger, string calldata insuranceId, uint256 updatedTimestamp, string calldata flightId)external payable requireIsOperational{
        flightSuretyData.buy(airline, passenger, insuranceId, updatedTimestamp, flightId);
    }

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    address private contractOwner;          // Account used to deploy contract

    constructor(address datacontract) public {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(datacontract);
    }

    function isOperational()public view returns(bool){
        return flightSuretyData.isOperational(); 
    }
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/
    modifier requireIsOperational(){
        require(flightSuretyData.isOperational(), "Contract is currently not operational");  
        _; 
    }
    modifier requireContractOwner(){
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string calldata flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   

    /********************************************************************************************/
    /*               FLIGHT SURETY DATA CONTRACT FUNCTIONS DEFENATION                           */
    /********************************************************************************************/
contract FlightSuretyData {
    function isOperational() public view returns(bool);

    function getAirlinesCounter() external returns(uint);
    function getFundedAirlinesCounter() external returns(uint);
    function isRegisteredAirlineFunc(address airline) public returns(bool);
    function isFundedAirlineFunc(address airline) public returns(bool);
    //function registerAirline(address airlineToBeRegistered)external;
    function registerAirline(address airlineToBeRegistered, address airlineWantToRegisterOtherAirline) external;
    function fund()external payable;
    //function fund()external payable requireIsOperational;
    function vote(address airlineToRegister, address votingAirline)external;
    //function vote(address airlineToRegister, address votingAirline)external requireIsOperational;
    function getAirlineVotesCount(address airline)external returns(uint);
    //function getAirlineVotesCount(address airline)external requireIsOperational returns(uint);

    function isRegisteredFlightFunc(bytes32 flightKey) external returns (bool);
    function getFlightKeyFunc(string memory flightId) public returns(bytes32);
    function registerFlight(uint8 statusCode, uint256 updatedTimestamp, address airline, string calldata flightId) external;
    //function registerFlight(uint8 statusCode, uint256 updatedTimestamp, address airline, string calldata flightId) external requireIsOperational;

    function buy(address payable airline, address passenger, string calldata insuranceId, uint256 updatedTimestamp, string calldata flightId)external payable;
    //function buy(address payable airline, address passenger, string calldata insuranceId, uint256 updatedTimestamp, string calldata flightId)external payable requireIsOperational;
    function creditInsurees(bytes32 insuranceKey)external;
    //function creditInsurees(bytes32 insuranceKey)external requireIsOperational;
    function pay(bytes32 insuranceKey) external;
    //function pay(bytes32 insuranceKey) external requireIsOperational;
    function getInsuranceKey(address airline, string memory flightId, uint256 timestamp)pure public returns(bytes32);



}