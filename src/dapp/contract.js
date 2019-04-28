import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) { // DONE :) 

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];

        // Fixed flight: 
        this.flightID = "101";
        this.flightID = "202";

        // First four airlines to regiser them:
        this.first  = null;
        this.second = null;
        this.third  = null;
        this.fourth = null;

        const x = web3.toWei(10, 'ether');
    }

    initialize(callback) { // DONE :)
        this.web3.eth.getAccounts(async(error, accts) => {

            this.owner  = accts[0];
            this.first  = accts[1];
            this.second = accts[2];
            this.third  = accts[3];
            this.fourth = accts[4];

            this.airlines.push(this.first);
            this.airlines.push(this.second);
            this.airlines.push(this.third);
            this.airlines.push(this.fourth);

            this.passenger1 = accts[33];
            this.passengers.push(this.passenger1);

            const x = web3.toWei(10, 'ether');

            this.flightSuretyData.methods.fund().send({from: this.owner, value: x,gas: 4712388, gasPrice: 100000000000}, (err, res)=>{
                if(res){
                    console.log("FUNDING FROM DAPP OKAY :)");
                }
                if(err){
                    console.log(err);
                    console.log("The revert happen because when first you load the dapp it will fund this account, then if you load it again without run truffle migrate --reset, it reverted because it is already funded. which is the logic that the project want. :) ");
                }
            });

            callback();
        });
    }
    isOperational(callback) { // DONE :)
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }
    fetchFlightStatus(flight, callback) { // DONE :)
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000),
            statusCode: 0
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
    registerFlight(flightId, callback){ // DONE :)
        let self = this;
        let airline = this.airlines[1];
        let time = Math.floor(Date.now() / 1000);
        let code = 0;
        self.flightSuretyData.methods.registerFlight(code, time, airline, flightId).send({from: self.owner, gas: 9999999}, (err, res) =>{
            callback(err, res);
        });
    }
    buy(flightId, amount, callback){ // DONE :)
        let self = this;
        let airline = this.airlines[0];
        let passenger = this.passengers[0];
        console.log("PASSENGER: "+passenger);
        let time = Math.floor(Date.now() / 1000);
        try{
            console.log("before buy: ");
            self.flightSuretyData.methods.buy(airline,passenger , "insuranceId",time, flightId, this.web3.utils.toWei(amount,"ether")).send({from: passenger, value:this.web3.utils.toWei(amount,"ether"),gas: 4712388, gasPrice: 100000000000}, (err, res) => {
                callback(err, res);
                console.log("RESULT :"+res);
            });
        }catch(error){
            console.log("ERROR: "+error);
        }
    }


}