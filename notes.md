- user must create a 'template' for their payment provider before wrapping a token. I imagine this would likely be done through builder, currently calling it on the smart contract itself and hardcoding the ID.
    - should heavily flag destructionOnly as a param. I suspect most projects for 721s would want to reclaim the asset while 1155s could be burnt in most cases.
- 5 minute clawback duration


wrap parameters:
Token types == 0 for ERC20, 1 for 721, 2 for 1155



Mint tokens to address from Relayer which then transfers to Clawback contract


User will have a wrapped version of the token in their wallet

- Anybody can add given tokens to a target template - is this desired behavior? Doesn't seem to pose a security risk but would be odd for me as a 'template owner' if somebody was using my template and wrapping random tokens.

- Beneficial to have a 2 step process to show the Minting/Approval functions and then 'Securing with Sequence Protect'.
- Would like an API hosted by sequence (indexer endpoint) to return that returns the metadata using the clawbackMetadata contract as a base64 and decodes to a json object. It's fairly trivial, but would be annoying to instantiate the contract and retrieve the clawback contract as an external dev then decode this across different platforms. We lose some benefit of our value prop if we don't support devs to do this with the indexer.

In general this flow seems better suited to primary sales vs marketplace as there's the inherent risk of somebody trading their wrapped NFT and then doing the chargeback so the receiver bears the risk. Additionally, there is likely overhead for 3rd party as well as sequence marketplaces to support the wrapped assets.

Unwrapping is fairly trivial, however I recommend we have a dedicated page where users could go with their wrapped assets and check the status. I imagine many developers would not want to build this functionality, do checks against the contract, etc.

- when calling the unwrap() function passing the wrappedTokenId parameter, passing the 0th index doesn't work. May be something i'm not familiar with in solidity but it's weird and something to flag as the token is the 0th index.


Currently using static variables for minting tokens, should pull this in dynamically to get the current tokenId iteration.