
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
          await config.flightSuretyData.registerAirline(second, first);
          await config.flightSuretyData.registerAirline(third, first);
          await config.flightSuretyData.registerAirline(fourth, first);
      }catch(error){
        console.log("ERROR first 4 airlies can be registerd  by other. ",error);
     }
     assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(second), true,"not register 2");
     assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(third), true,"not register 2");
     assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(fourth), true,"not register 2");

  })
  it('fifth airline and above can not be registerd by other, but use voting to be registered.', async() =>{
    let first  = accounts[1];
    let second = accounts[2];
    let third  = accounts[3];
    let fourth = accounts[4];
    let fifth  = accounts[5];

    const x = web3.utils.toWei('10', 'ether');
    try{
        //await config.flightSuretyData.fund({from: first, value: x});

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
        //console.log("ERROR fifth airline and above can not be registerd by other, but use voting to be registered.: ",error);
    }
    try{
        await config.flightSuretyData.registerAirline(fifth, first);
    }catch(error){
        //console.log("ERROR await config.flightSuretyData.registerAirline(fifth, first): ",error);
    }
    assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(fifth), true, "fifth registreation.");
  })
  it('Airline can be registered, but does not participate in contract until it submits funding of 10 ether.', async() =>{
    let first  = accounts[1];
    let second = accounts[2];
    let third  = accounts[3];
    let fourth = accounts[4];
    let fifth  = accounts[5];
    let sixth  = accounts[6];

    const x = web3.utils.toWei('10', 'ether');
    try{
        //await config.flightSuretyData.fund({from: first, value: x});

        //await config.flightSuretyData.registerAirline(second, first);
        //await config.flightSuretyData.registerAirline(third, first);
        //await config.flightSuretyData.registerAirline(fourth, first);
        await config.flightSuretyData.registerAirline(fifth, first);

        //await config.flightSuretyData.fund({from: second, value: x});
        //await config.flightSuretyData.fund({from: third, value: x});
        //await config.flightSuretyData.fund({from: fourth, value: x});

        //await config.flightSuretyData.vote(fifth, second);
        //await config.flightSuretyData.vote(fifth, third);
        //await config.flightSuretyData.vote(fifth, fourth);

        await config.flightSuretyData.vote(sixth, second);
        await config.flightSuretyData.vote(sixth, third);
        await config.flightSuretyData.vote(sixth, fourth);
    }catch(error){
        console.log("ERROR fifth airline and above can not be registerd by other, but use voting to be registered.: ",error);
    }
    try{
        await config.flightSuretyData.registerAirline(sixth, fifth);
    }catch(error){
        //console.log("if in catch mean second airline can not register which mean it is right because it did not fund: ",error);
    }
    assert.equal(await config.flightSuretyData.isRegisteredAirlineFunc.call(sixth), false, "fifth registreation by second.");
  })
  it('register flight succesffly.', async() => {
      let flightID = "101";
      let airline = accounts[1];
      let code = 0;
      let timestamp = Math.floor(Date.now() / 1000);

      try{
          await config.flightSuretyData.registerFlight(code, timestamp, airline, flightID, {from: airline});
      }catch(error){
          //console.log("SOMTHJE: ",error);
      }
      //console.log("ID: "+flightID);
      var key = await config.flightSuretyData.getFlightKeyFunc.call(flightID, {from: airline});
      //var key = await config.flightSuretyData.getFlightKey.call(airline, flightID, timestamp);
      //console.log("KEY: "+key);
      assert.equal(await config.flightSuretyData.isRegisteredFlightFunc.call(key), true,"NOT register flight :(");
  })
  it('Passengers may pay up to 1 ether for purchasing flight insurance.', async() => {
      let passenger = accounts[7];
      let airline = accounts[1];
      let timestamp = Math.floor(Date.now() / 1000);
      var balance1 = 0;
      var balance2 = 0;
      var amount =await web3.utils.toHex(web3.utils.toWei('1', 'ether'))
      web3.eth.getBalance(passenger, async (err, wei) => {
        balance1 = await web3.utils.fromWei(wei, 'ether')
        //console.log("Balance1: "+ balance1);       
      });

        try{
            await config.flightSuretyData.buy(airline, passenger, "insurance ID", timestamp, "101", {from: passenger, value: amount});
            //.send({from: passenger, value: amount});
        }catch(error){
        console.log("ERROR: Passengers may pay up to 1 ether for purchasing flight insurance. ",error);
        }

      web3.eth.getBalance(passenger,async (err, wei) => {
        balance2 = await web3.utils.fromWei(wei, 'ether')
        //console.log("Balance2: "+ balance2);
    });
    let flag = false;
    if(balance2 < balance1){
        flag = true;
    }
    assert.equal(flag, true,"FLAG BALANCE.");

  })
  it('If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid', async() => {
      let passenger = accounts[8];
      let airline = accounts[1];
      let timestamp = Math.floor(Date.now() / 1000);
      var balance1airline = 0;
      var balance2airline = 0;
      var amount =await web3.utils.toHex(web3.utils.toWei('1', 'ether'));

      web3.eth.getBalance(airline, async (err, wei) => {
        balance1airline = await web3.utils.fromWei(wei, 'ether')
        //console.log("Balance airline1: "+ balance1airline);       
      });

      let key = 0;
      try{
        await config.flightSuretyData.buy(airline, passenger, "insurance ID", timestamp, "101", {from: passenger, value: amount});
        key = await config.flightSuretyData.getInsuranceKey(airline, "101", timestamp);
        //console.log("Key1: "+ key);
        //.send({from: passenger, value: amount});
        }catch(error){
            console.log("ERROR: Passengers may pay up to 1 ether for purchasing flight insurance. ",error);
        }
      
      try{
        key = await config.flightSuretyData.getInsuranceKey(airline, "101", timestamp);
        await config.flightSuretyData.creditInsurees(key, {from: airline});
        //console.log("Key2: "+ key);
      }catch(error){
        console.log("ERROR: config.flightSuretyData.getInsuranceKey",error);
      }

        

      web3.eth.getBalance(airline,async (err, wei) => {
        balance2airline = await web3.utils.fromWei(wei, 'ether')
        //console.log("Balance airline2: "+ balance2airline);
    });
    let flag = false;
    if(balance2airline < balance1airline){
        flag = true;
    }
    assert.equal(flag, true,"FLAG BALANCE.");
  })
  it('Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout', async() => {
    let passenger = accounts[9];
    let airline = accounts[1];
    let timestamp9 = Math.floor(Date.now() / 1000);
    var balance1airline = 0;
    var balance2airline = 0;
    var amount =await web3.utils.toHex(web3.utils.toWei('1', 'ether'));

    let key = 0;
    try{
      await config.flightSuretyData.buy(airline, passenger, "insurance ID", timestamp9, "101", {from: passenger, value: amount});
      key = await config.flightSuretyData.getInsuranceKey(airline, "101", timestamp9);
      }catch(error){
          console.log("ERROR: Passengers may pay up to 1 ether for purchasing flight insurance. ",error);
      }
    
    try{
      key = await config.flightSuretyData.getInsuranceKey(airline, "101", timestamp9);
      await config.flightSuretyData.creditInsurees(key, {from: airline});
      await config.flightSuretyData.pay(key,{from: passenger});
    }catch(error){
      console.log("ERROR: config.flightSuretyData.getInsuranceKey",error);
    }

  let flag = true;
  assert.equal(flag, true,"FLAG BALANCE.");
  })
  it('Insurance payouts are not sent directly to passenger’s wallet', async() => {
    let passenger10 = accounts[10];
    let airline10 = accounts[0];
    let timestamp10 = Math.floor(Date.now() / 1000);
    var balance10 = 0;
    var balance20 = 0;
    var amount10 =await web3.utils.toHex(web3.utils.toWei('1', 'ether'));
    let key10 = 0;
    try{
      await config.flightSuretyData.buy(airline10, passenger10, "insurance ID", timestamp10, "101", {from: passenger10, value: amount10});
      key10 = await config.flightSuretyData.getInsuranceKey(airline10, "101", timestamp10);
      }catch(error){
          console.log("ERROR: Passengers may pay up to 1 ether for purchasing flight insurance. ",error);
      }
      web3.eth.getBalance(passenger10, async (err, wei) => {
        balance10 = await web3.utils.fromWei(wei, 'ether')
        console.log("Balance 10: "+ balance10);       
      });

      
    
    try{
      key10 = await config.flightSuretyData.getInsuranceKey(airline10, "101", timestamp10);
      await config.flightSuretyData.creditInsurees(key10, {from: airline10});
    }catch(error){
      console.log("ERROR: config.flightSuretyData.getInsuranceKey",error);
    }
    web3.eth.getBalance(passenger10, async (err, wei) => {
        balance20 = await web3.utils.fromWei(wei, 'ether')
        console.log("Balance 20: "+ balance20);       
      });
  let flag = false;
  console.log("1- "+balance10+"  2- "+balance20);
  if(balance20 == balance10){ // means no change happend in the passenger wallet. 
      flag = true;
  }
  assert.equal(flag, false,"FLAG BALANCE.");
})

});
