
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var Web3 = require('web3');

if (typeof web3 !== 'undefined'){
    web3 = new Web3(web3.currentProvider);
   } else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
}

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });
  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });
  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });
  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
////
      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });
  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let airline1 = accounts[0];
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, airline1, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isRegisteredAirlineFunc.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
  it('register first airline when deploying.', async() =>{
      let firstAirline = accounts[1];
      assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(firstAirline), true," first airline OKAY :)");
  })
  it('airline did not fund, can not register others.', async() =>{
      let oldAirline = accounts[0];
      let newAirline = accounts[2];

      try{
        await config.flightSuretyData.registerAirline(newAirline, {from: oldAirline} );
      }catch(error){
        //console.log("ERROR ID 01: ", error);
      }

      assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(newAirline),false ,"yes you can not register other until funding.");
      
  })
  it('first 4 airlies can be registerd  by other.', async() =>{
      let first  = accounts[1];
      let second = accounts[2];
      let third  = accounts[3];
      let fourth = accounts[4];
      let fifth  = accounts[5];
      const x = web3.utils.toWei('10', 'ether');

      try{
          await config.flightSuretyData.fund({from: first, value: x});
      }catch(error){
          console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU   ERROR ID 02: ",error);
      }
      try{
          /*
          await config.flightSuretyData.registerAirline(second, {from: first});
          await config.flightSuretyData.registerAirline(third, {from: first});
          await config.flightSuretyData.registerAirline(fourth, {from: first});
*/
          await config.flightSuretyData.registerAirline(second, first);
          await config.flightSuretyData.registerAirline(third, first);
          await config.flightSuretyData.registerAirline(fourth, first);
      }catch(error){
        //console.log("ERROR ID 03: ",error);
     }
     assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(second), true);
     assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(third), true);
     assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(fourth), true);

  })
  it('fifth airline and above can not be registerd by other, but use voting to be registered.', async() =>{
    let first  = accounts[1];
    let second = accounts[2];
    let third  = accounts[3];
    let fourth = accounts[4];
    let fifth  = accounts[5];

    const x = web3.utils.toWei('10', 'ether');
    try{
        await config.flightSuretyData.fund({from: first, value: x});

        await config.flightSuretyData.registerAirline(second, first);
        await config.flightSuretyData.registerAirline(third, first);
        await config.flightSuretyData.registerAirline(fourth, first);

        await config.flightSuretyData.fund({from: second, value: x});
        await config.flightSuretyData.fund({from: third, value: x});
        await config.flightSuretyData.fund({from: fourth, value: x});

        await config.flightSuretyData.vote(fifth, second);
        await config.flightSuretyData.vote(fifth, third);
        await config.flightSuretyData.vote(fifth, fourth);
    }catch(error){
        //console.log("ERROR ID 04: ",error);
    }
    try{
        await config.flightSuretyData.registerAirline(fifth, first);
    }catch(error){
        //console.log("ERROR ID 05: ",error);
    }
    assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(fifth), true, "fifth registreation.");
  })
  it('register flight succesffly.', async() => {
      let flightID = "101";
      let airline = accounts[1];
      let code = 0;
      let timestamp = Math.floor(Date.now() / 1000);

      try{
          await config.flightSuretyData.registerFlight(code, timestamp, airline, flightID, {from: airline});
      }catch(error){
          console.log("SOMTHJE: ",error);
      }
      console.log("ID: "+flightID);
      var key = await config.flightSuretyData.getFlightKeyFunc.call(flightID, {from: airline});
      //var key = await config.flightSuretyData.getFlightKey.call(airline, flightID, timestamp);
      //console.log("KEY: "+key);
      assert.equal(await config.flightSuretyData.isRegisteredFlightFunc.call(key), true,"NOT register flight :(");
  })

});
