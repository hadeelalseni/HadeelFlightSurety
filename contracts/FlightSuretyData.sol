//pragma solidity ^0.4.25;
pragma solidity ^0.5.0;

//import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;
    using SafeMath for uint;


    /********************************************************************************************/
    /*                                       AIRLINE STUFF                                      */
    /********************************************************************************************/

    struct Airline{
        bool isRegistered;
        bool isFunded;
    }
    event AirlineRegisteredEvent (address airline);
    event AirlineFundedEvent(address airline);
    mapping (address => Airline) airlinesList;
    mapping (address => uint) airlineVotes;
    uint airlinesCounter = 0;
    uint fundedAirlinesCounter = 0; 

    function getAirlinesCounter() external returns(uint){ //DONE :)
        return airlinesCounter;
    }
    function getFundedAirlinesCounter() external returns(uint){ //DONE :)
        return fundedAirlinesCounter;
    }
    function isRegisteredAirlineFunc(address airline) public returns(bool){ // DONE :)
        return airlinesList[airline].isRegistered;
    }
    function isFundedAirlineFunc(address airline) public returns(bool){ // DONE :)
        return airlinesList[airline].isFunded;
    }
    /*   function registerAirline(address airlineToBeRegistered)external requireIsOperational{ // DONE :)
        //I just put a stupid names to not get lost ::D.
        require(isFundedAirlineFunc(msg.sender),"If you want to register other, fund 10 ether first -.-");
        Airline storage _airline = airlinesList[airlineToBeRegistered];
        _airline.isRegistered = true;
        airlinesCounter = airlinesCounter + 1;
        emit AirlineRegisteredEvent(airlineToBeRegistered);
    }*/

    function registerAirline(address airlineToBeRegistered, address airlineWantToRegisterOtherAirline) external  requireIsOperational { // DONE :)
        //I just put a stupid names to not get lost ::D.
        require(isFundedAirlineFunc(airlineWantToRegisterOtherAirline),"If you want to register other, fund 10 ether first -.-");
        Airline storage _airline = airlinesList[airlineToBeRegistered];
        _airline.isRegistered = true;
        airlinesCounter = airlinesCounter + 1;
        emit AirlineRegisteredEvent(airlineToBeRegistered);
    }
    function fund()external payable requireIsOperational{ // DONE :)
        require(isRegisteredAirlineFunc(msg.sender), "airline is not registered yet, so you can not fund.");
        require(!isFundedAirlineFunc(msg.sender), "airline is already funded, why you want to fund again :P.");
        require(msg.value >= 10 ether, "You have to fund with 10 ether at least.");
        airlinesList[msg.sender].isFunded = true;
        contractOwner.transfer(msg.value);
        fundedAirlinesCounter = fundedAirlinesCounter + 1;

        emit AirlineFundedEvent(msg.sender);

    }
    function vote(address airlineToRegister, address votingAirline)external requireIsOperational{
        require(isFundedAirlineFunc(votingAirline),"You can not vote until pay a fund .");
        airlineVotes[airlineToRegister] = airlineVotes[airlineToRegister].add(1);
    }
    function getAirlineVotesCount(address airline)external requireIsOperational returns(uint){
        return airlineVotes[airline];
    }
    /********************************************************************************************/
    /*                                       FLIGHT STUFF                                       */
    /********************************************************************************************/
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline; 
        string flightId;
    }
    mapping(bytes32 => Flight) private flightsList; // Flight key to flight
    mapping(string => bytes32) flightIdKey; // Mapping a flight id to its key to return it
    event flightRegisteredEvent (bytes32 flightKey);

    function isRegisteredFlightFunc(bytes32 flightKey) external returns (bool){ // DONE :)
        return flightsList[flightKey].isRegistered;
    }
    function getFlightKeyFunc(string memory flightId) public returns(bytes32){ // DONE :)
        return flightIdKey[flightId];
    }
    function registerFlight(uint8 statusCode, uint256 updatedTimestamp, address airline, string calldata flightId) external requireIsOperational{// DONE :)
        require(isFundedAirlineFunc(airline),"If you want to register a flight, fund 10 ether first -.-");
        bytes32 flightKey = getFlightKey(airline, flightId, updatedTimestamp);
        flightIdKey[flightId] = flightKey;
        Flight storage _flight = flightsList[flightKey];
        _flight.isRegistered = true;
        _flight.statusCode = statusCode;
        _flight.updatedTimestamp = updatedTimestamp;
        _flight.airline = airline;
        _flight.flightId = flightId;
        emit flightRegisteredEvent(flightKey);
    }
    function getFlightKey(address airline, string memory flight, uint256 timestamp)pure internal returns(bytes32){ // DONE :)
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /********************************************************************************************/
    /*                                       INSURANCE STUFF                                    */
    /********************************************************************************************/

    struct Insurance{
        address passenger;
        uint insuranceAmount;
        uint money;
        uint256 updatedTimestamp;
        string insuranceId;  
    }
    mapping(bytes32 => Insurance) private insurancesList; // Insurance key to insurance itself
    mapping(string => bytes32) insuranceIdKey; // mapping passenger address to his insurances list he has paied.
    mapping(bytes32 => bytes32) insuranceFlightMapping;

    event PassengerPaidInsuranceEvent(address passenger, bytes32 insuranceKey);
    event InsureeCreditedEvent(bytes32 insuranceKey);

    /*
    function getInsuranceKey(address airline, address passenger, string memory insuranceId, uint256 timestamp)pure internal returns(bytes32){ // DONE :)
        return keccak256(abi.encodePacked(airline, passenger, insuranceId, timestamp));
    }
    */
    function getInsuranceKey(address airline, string memory flightId, uint256 timestamp)pure public returns(bytes32){ // DONE :)
        return keccak256(abi.encodePacked(airline, flightId, timestamp));
    }

    function buy(address payable airline, address passenger, string calldata insuranceId, uint256 updatedTimestamp, string calldata flightId)external payable requireIsOperational{ // DONE :)
        uint amountPassengerSent = msg.value;
        require(amountPassengerSent <= 1 ether, "msg.value > 1 ether which is not allowed.");
        bytes32 flightKey = flightIdKey[flightId];
        //bytes32 insuranceKey = getInsuranceKey(airline, passenger, insuranceId, updatedTimestamp);
        bytes32 insuranceKey = getInsuranceKey(airline, flightId, updatedTimestamp);
        insuranceFlightMapping[flightKey] = insuranceKey;
        Insurance storage _insurance = insurancesList[insuranceKey];
        _insurance.passenger = passenger;
        _insurance.insuranceAmount = amountPassengerSent;
        _insurance.money = 0;
        _insurance.updatedTimestamp = updatedTimestamp;
        _insurance.insuranceId = insuranceId;
        airline.transfer(amountPassengerSent);

        emit PassengerPaidInsuranceEvent(passenger, insuranceKey);

    }

    function creditInsurees(bytes32 insuranceKey)external requireIsOperational{ // DONE :)
        Insurance storage insuranceToCredit = insurancesList[insuranceKey];
        address insuree = insuranceToCredit.passenger;

        insuranceToCredit.money = insuranceToCredit.money.mul(3);
        insuranceToCredit.money = insuranceToCredit.money.div(2);

        emit InsureeCreditedEvent(insuranceKey);

    }
 
    function pay(bytes32 insuranceKey) external requireIsOperational{
        // if passenger buy insurance !!!
        Insurance storage _insurance = insurancesList[insuranceKey];
        //address insuree = passengerInsurance[_insurance];
        address payable insuree = address(uint160(_insurance.passenger));
        require(_insurance.money > 0 ,"Your money is zero, so you did not buy insurance and we can not pay to you :P");
        insuree.transfer(_insurance.money);
        _insurance.money = 0;

    }



    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address payable private contractOwner;                                     
    bool private operational = true; 
                                      
    constructor(address airline) public { // DONE :)
        contractOwner = msg.sender;
        Airline storage _airline = airlinesList[airline];
        _airline.isRegistered = true;
        airlinesCounter = airlinesCounter + 1; 
        //airlinesCounter.add(1);
        emit AirlineRegisteredEvent(airline);
    }
    function()external payable {}

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier requireIsOperational(){ // DONE :)
        require(operational, "Contract is currently not operational");
        _; 
    }

    modifier requireContractOwner(){ // DONE :)
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier isAuthorizedCaller(){ // DONE :)
        require(authorizedCaller[msg.sender], "The caller is not authorized.");
        _;
    }

    modifier isRegisteredAirline(){ // DONE :)
        require(airlinesList[msg.sender].isRegistered, "The airline is not registered yet.");
        _;
    }

    modifier isFundedAirline(){ // DINE :)
        require(airlinesList[msg.sender].isFunded, "The airline is not funded.");
        _;
    }

    modifier isRegisteredFlight(bytes32 flightKey){ // DINE :)
        require(flightsList[flightKey].isRegistered, "The flight is not registered." );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/ 
    mapping (address => bool) authorizedCaller;   
    function isOperational()public view returns(bool){ // DINE :)
        return operational;
    }

    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    function authorizeCaller(address caller) external requireContractOwner{ // DONE :)
        authorizedCaller[caller] = true;
    }
    function unAuthorizeCaller(address caller) external requireContractOwner{ // DONE :)
        authorizedCaller[caller] = false;
    }

}

