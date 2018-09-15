const Migrations = artifacts.require('./Migrations.sol');
const EnvoyTokenMock = artifacts.require('./EnvoyTokenMock.sol');

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Migrations);
  deployer.deploy(EnvoyTokenMock, accounts[0], 100);
};
