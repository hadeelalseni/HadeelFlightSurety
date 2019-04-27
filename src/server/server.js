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
let oracleIndexs = [];


registerOracles();
//hitOracle();

async function registerOracles(){
  var accounts = await web3.eth.getAccounts();
  for(let i = 19; i<= 39; i++){
    //console.log("Before: "+i);
    hitOracle(accounts[i]);
    oracleIndexs.push(i);
    //console.log("hitOracle:  ", i);
  }
}
async function hitOracle(oracle){
  //var accounts = await web3.eth.getAccounts();
  try{
    const FEE = await flightSuretyApp.methods.REGISTRATION_FEE.call({from: web3.eth.defaultAccount});
    await flightSuretyApp.methods.registerOracle.send({ from: oracle, value: FEE, gas:3000000});
    
  }catch(error){
    console.log("ERROR: hitOracle:  ", error);
  }
}
console.log("??");
//submit();
console.log("called");
async function submit(){
  for(let i = 0; i < oracleIndexs.length; i++){
    console.log("Submit before: ");
    await submitResponse(oracleIndexs[i],accounts[2] , "101", 0, accounts[1]);
    console.log("Submit aftere: ");
  }

}

async function submitResponse(oracleIndex, airline, flight, timestamp, code, address){
  try{
    console.log("before await flightSuretyApp.methods.submitOracleResponse");
    await flightSuretyApp.methods.submitOracleResponse(oracleIndex, airline, flight, timestamp, code).send({from: address, gas: 999999 });
    console.log("submitResponse: "+oracleIndex+ airline+ flight+ timestamp+ code+ address);
  }catch(error){
    console.log("Error function submitResponse : ", error);
  }
}
flightSuretyApp.events.OracleRequest({fromBlock: 0}, async function (error, event) {
    if (error) {
      console.log("ERROR: flightSuretyApp.events.OracleRequest({fromBlock: 0}",error);
    }
    console.log("EVENT: "+event);
    var accounts = await web3.eth.getAccounts();
    var airline = event.returnValues.airline;
    var index   = event.returnValues.index;
    var flight  = event.returnValues.flight;
    var time    = event.returnValues.timestamp;
    var code    = Math.floor(Math.random() % 2 + 7 * 4)*10; // I look in google for a random in javascript, I think this is correct :D
    var oracles = [];

    for(let i = 11; i<33; i++){
      oracles.push[accounts[i]];
    }

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


