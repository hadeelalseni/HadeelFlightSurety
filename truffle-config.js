var HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = "brisk time course relief keep refuse season rebel spot soft select produce";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
      gas: 5555555
    },



/*
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 9999999
    }
  },*/
  compilers: {
    solc: {
      version: "^0.5.0"
    }
  }
}//;

}