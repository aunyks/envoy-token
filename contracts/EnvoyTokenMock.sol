pragma solidity ^0.4.24;

import "./EnvoyToken.sol";

contract EnvoyTokenMock is EnvoyToken {

  constructor(address initialAccount, uint256 initialBalance) public {
    _mint(initialAccount, initialBalance);
  }

  function mint(address account, uint256 amount) public {
    _mint(account, amount);
  }

  function burn(address account, uint256 amount) public {
    _burn(account, amount);
  }

  function burnFrom(address account, uint256 amount) public {
    _burnFrom(account, amount);
  }

}