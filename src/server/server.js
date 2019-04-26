import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
//import Web3 from 'web3';
import express from 'express';
import 'babel-polyfill';
var Web3 = require('web3');


let config = Config['localhost'];
const web3 = new Web3(Web3.givenProvider || 'ws://localhost:7545', null, {});
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);



registerOracles();


async function registerOracles(){
  var accounts = await web3.eth.getAccounts();
  for(let i = 19; i<39; i++){
    hitOracle(accounts[i]);
  }
}
async function hitOracle(oracle){
  try{
    const FEE = await flightSuretyApp.methods.REGISTRATION_FEE.call({from: accounts[0]});
    await flightSuretyApp.methods.registerOracle.send({ from: oracle, value: FEE, gas:3000000});
  }catch(error){
    console.log("ERROR: ", error);
  }
}
async function submitResponse(oracleIndex, airline, flight, timestamp, code, address){
  try{
    await flightSuretyApp.methods.submitOracleResponse(oracleIndex, airline, flight, timestamp, code).send({from: address, gas: 9999999 });
  }catch(error){
    console.log("ERRRRRORRORORO : ", error);
  }
}
flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) {
      console.log(error);
    }
    console.log("EVENT: "+event);

    var airline = event.returnValues.airline;
    var index   = event.returnValues.index;
    var flight  = event.returnValues.flight;
    var time    = event.returnValues.timestamp;
    var code    = Math.floor(Math.random() % 2 + 7 * 4)*10; // I look in google for a random in javascript, I think this is correct :D
    var oracles = [];











    console.log("oracleRequest - index:"+ index+"	flight: "+ flight+"status code:"+code);












    try{
      for(let i = 0; i< oracles.length; i++){













        console.log("i:        "+ i);










        var oracles2D = oracles[i][1];

        for(let i = 0; i<3; i++){
          if(oracles2D[i] == index){

















            console.log('matcing index found account'+oracles[i][0]+"	indx:"+indexesArray[idx]+"	 array:"+ indexesArray );



            submitResponse(index, airline, flight, time, code, oracles[i][0]);








          }
        }







      }
    }catch(error){
      console.log("ERRROR: "+error);
    }









});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


