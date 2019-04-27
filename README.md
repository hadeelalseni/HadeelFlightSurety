# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Steps to run my project: 
`npm install`
`npm install openzeppelin-solidity`
`npm install truffle-hdwallet-provider`
`npm install bignumber.js`
`npm install web3`
`npm install -g webpack-dev-server`
`npm install --save-dev webpack`
`npm install --save-dev webpack-dev-server`
`npm install --save-dev webpack-cli`
`truffle compile`
`truffle migrate`
`truffle test`
`npm run server`
`npm run dapp`

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To view dapp:

`http://localhost:8000`

#Versions: 
Truffle v5.0.14 (core: 5.0.14)
Solidity v0.5.0 (solc-js)
Node v9.7.1
Web3.js v1.0.0-beta.37

also in node_modules -> openzippline -> math library
change the pragama line to :  pragma solidity ^0.5.0;

#Attention1: 
may you faced problem when (`npm run server` or `npm run dapp`), 
please re run the beleow command and the erre will gone: 
`npm install -g webpack-dev-server`
`npm install --save-dev webpack`
`npm install --save-dev webpack-dev-server`
`npm install --save-dev webpack-cli`

#Attention2:
for copmiler version problems I attached pdf explaines what I change and that is work for me very well.
also I change line in package.json file as it was giving me an error, I mensioned that in the pdf alos.


