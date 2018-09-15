# Envoy

An ERC20-compliant token equipped with delegated transferring.

Envoy is an ERC20 token that borrows from the [ERC865](https://github.com/ethereum/EIPs/issues/865) standard. This allows tokens that descend from Envoy to be transferred without the sender having any Ether to spend as gas, as long as a delegate with Ether is willing to broadcast the transaction (while taking a fee as payment).

## How do I incorporate it in my project?

Simply import it via its Github url!

```
pragma solidity a.solc.version;

import "github.com/aunyks/envoy/contracts/EnvoyToken.sol";

contract MyToken is EnvoyToken {}
```
