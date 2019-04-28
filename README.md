# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.
### Ganache setup: 
- run Ganache with 40 accounts.
- and use `truffle migrate --reset`

## Steps to run my project: 
- `npm install`
- `truffle compile`
- `truffle migrate`
- `truffle test ./test/flightSurety.js`
- `truffle test ./test/oracles.js`
- `npm run server`
- `npm run dapp`

## if the web3 version is not web3@1.0.0-beta.37:
please do the following: 
1. `npm uninstall web3 --save`
2. `npm install web3@1.0.0-beta.37`
3. make sure that the version of web3 in package.json is "web3": "^1.0.0-beta.37". 


To view dapp:
`http://localhost:8000`

## VERSIONS: 
1. Truffle v5.0.14 (core: 5.0.14)
1. Solidity v0.5.0 (solc-js)
1. Node v9.7.1
1. Web3.js v1.0.0-beta.37

### Attention1: 
1. may you faced problem when (`npm run server` or `npm run dapp`), please re run the beleow command and the erre will gone: 
- `npm install -g webpack-dev-server`
- `npm install --save-dev webpack`
- `npm install --save-dev webpack-dev-server`
- `npm install --save-dev webpack-cli`

### DAPP issue
1. when you run the dapp first time it will run okay, then If you refresh the page without useing `truffle migrate --reset` you will get revert Error, The revert happen because when first you load the dapp it will fund this account, then if you load it again without run `truffle migrate --reset`, it reverted because it is already funded. which is the logic that the project want. :) 

### Server hanging issue

1. The server was hanging because the web3-beta-52 does not support promises/await with transactions https://github.com/ethereum/web3.js/issues/2681

### Server hanging solution

1. Downgrade web3-beta52 to web3-beta37

### web3-beta37 introduced issues

1. Some web3 methods needs to be handled differently

### Solutions

1. Add invocation `()` calls to every send/call method  e.g from `methods.fund.send({})` to `methods.fund().send({}) 


### PDF: 
I attached a pdf file with a screen shots of the proccess to follow. 
