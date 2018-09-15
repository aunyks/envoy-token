# Envoy

An ERC20-compliant token equipped with delegated transferring.

Envoy is an ERC20 token that borrows from the [ERC865](https://github.com/ethereum/EIPs/issues/865) standard. This allows tokens that descend from Envoy to be transferred without the sender having any Ether to spend as gas, as long as a delegate with Ether is willing to broadcast the transaction (while taking a fee as payment).

## How do I incorporate it in my project?

Install via NPM to your Truffle project.

```
> npm install -S envoy-token
```

and import the installed package.

```
pragma solidity a.solc.version;

import "envoy-token/contracts/EnvoyToken.sol";

contract MyToken is EnvoyToken {}
```

Or import via the Github url!

```
pragma solidity a.solc.version;

import "github.com/aunyks/envoy-token/contracts/EnvoyToken.sol";

contract MyToken is EnvoyToken {}
```

## API

This token contains all functions from the ERC20 standard that track supply, balances, and allowances. Thus, it does not have the `symbol()`, `name()`, and `decimals()` members.

The Envoy token adds two functions from the ERC865 standard: `transferPreSigned()` and `transferPreSignedHashing()`.

**transferPreSigned(
  bytes signature,
  address recipient,
  uint256 value,
  uint256 fee,
  uint256 nonce
)**  
Returns true if transaction succeeds.

- `signature` -- A byte array of the signature of keccak256(tokenContractAddress, recipient, value, fee, nonce)
- `recipient` -- The account to which the tokens will be sent.
- `value` -- The number of tokens to be sent to the recipient.
- `fee` -- The number of tokens to be sent to the delegate.
- `nonce` -- A transaction nonce.

**transferPreSignedHashing(
  address token,
  address recipient,
  uint256 value,
  uint256 fee,
  uint256 nonce
)**  
Returns the `bytes32` digest of the function parameters after tightly packing.

- `token` -- The address of the token contract.
- `recipient` -- The account to which the tokens will be sent.
- `value` -- The number of tokens to be sent to the recipient.
- `fee` -- The number of tokens to be sent to the delegate.
- `nonce` -- A transaction nonce.

## Acknowledgements

Some code in this repository is borrowed from the [OpenZeppelin Solidity](https://github.com/OpenZeppelin/openzeppelin-solidity) project.

## LICENSE

This project is licensed under the MIT License. If your project uses Envoy, this project must be publicly attributed.  
Copyright (c) 2018 Gerald Nash
