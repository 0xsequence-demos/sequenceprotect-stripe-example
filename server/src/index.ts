import 'dotenv/config'
import express from 'express'
import cors from 'cors'; // Added cors import
import { ethers } from 'ethers'
import { Session } from '@0xsequence/auth'
import { findSupportedNetwork, NetworkConfig } from '@0xsequence/network'
import Stripe from 'stripe';

const PORT = 4242
const app = express()

app.use(cors()); // Enable CORS for all origins
const stripe = new Stripe('sk_test_09l3shTSTKHYCzzZZsiLl2vA');

app.use(express.json())

const ERC1155Contract = '0x95d0c2907f2aa65561c0f217a78f9a366f9205f8'
const sequenceProtectAddress = '0x6F9a2c3E11011b894fae691d5338748f8048467d'
const sequenceProtectMetadataAddress = '0x335411eAA9D63251f8c0867600Be4d0C190a3b1f' 
const relayAddress = '0xBB7823355f7f0A608030db8be25781a877033a96'


// Validation method to check if the provided address is a valid Ethereum address
const isValidEthereumAddress = (address: any) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


const decodeBase64 = (base64String: string) => {
    // Remove the prefix 'data:application/json;base64,' from the base64 string
    const base64Data = base64String.split(',')[1];
    
    // Decode the base64 string
    const jsonString = atob(base64Data);

    // Parse the JSON string into an object
    try {
        const jsonObject = JSON.parse(jsonString);
        return jsonObject;
    } catch (error) {
        console.error("Error parsing JSON", error);
        return null;
    }
}

const calculateOrderAmount = (items) => {
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    let total = 0;
    items.forEach((item) => {
      total += item.amount;
    });
    return total;
  };

  const checkERC1155Approval = async(ownerAddress: string, operatorAddress: string, chainHandle: string) => {
    
    const abi = [
      "function isApprovedForAll(address account, address operator) external view returns (bool)"
    ];
    const chainConfig: NetworkConfig = findSupportedNetwork(chainHandle)!
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl)
    const contract = new ethers.Contract(ERC1155Contract, abi, provider);
    return await contract.isApprovedForAll(ownerAddress, operatorAddress);
  }
  


// Method to get a Sequence signer wallet for the EOA wallet defined in the .env file
const getSigner = async (chainHandle: string) => {
    try {
        const chainConfig: NetworkConfig = findSupportedNetwork(chainHandle)!
        const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl)


        const walletEOA = new ethers.Wallet(process.env.EVM_PRIVATE_KEY!, provider);

        // Create a single signer sequence wallet session
        const session = await Session.singleSigner({
            signer: walletEOA,
            projectAccessKey: process.env.PROJECT_ACCESS_KEY!
        })

        return session.account.getSigner(chainConfig.chainId)
    } catch (err) {
        console.error(`ERROR: ${err}`)
        throw err
    }
}

app.post('/mint', async (req: any,res: any) => {

// Endpoint to mint a collectible to the provided wallet address


    try {
        // Get the wallet address from the request body
        const { backendWalletAddress } = req.body

        const chainHandle = "arbitrum-sepolia"

        
        // Sequence Protect Contract
        const amount = 1

        // Define the chain handle, contract address, amount, and signer
        // Modify these variables based on your contract and requirements

        // Get the signer for the provided chain handle
        const signer = await getSigner(chainHandle)

        // Validate the provided wallet address
        if (!isValidEthereumAddress(relayAddress)) {
            return res.status(400).send({ error: "Please provide a valid EVM wallet address" });
        }
        
        let collectibleInterface;
        let data;

        // Standard interface for an ERC721 contract deployed via Sequence Builder
        // If you are using an ERC1155 or a different contract, you will need to update this interface
		// Standard interface for ERC1155 contract deployed via Sequence Builder
		collectibleInterface = new ethers.Interface([
			'function mint(address to, uint256 tokenId, uint256 amount, bytes data)'
		])

		data = collectibleInterface.encodeFunctionData(
			'mint', [backendWalletAddress, 0, String(amount), "0x00"]
		)

        // Construct the transaction object
        const txn = {
            to: ERC1155Contract, 
            data: data
        }

        // Send the transaction
        // If you are on a testnet, gas will be sponsored by Sequence
        // For mainnet contracts, make sure to import your contract at sequence.build
        // and sponsor it using the Gas Sponsorship feature
        let result;

        try {
            result = await signer.sendTransaction(txn)
        } catch (err) {
            console.log('mint error')
            console.error(`ERROR: ${err}`)
            throw err
        }

        if (await checkERC1155Approval(relayAddress, sequenceProtectAddress, chainHandle)) {
            console.log('approved')
        }

        else {
        const erc1155Interface = new ethers.Interface([
            "function setApprovalForAll(address _operator, bool _approved) returns ()",
          ]);
       
          // is not approved
          const dataApprove = erc1155Interface.encodeFunctionData(
            "setApprovalForAll",
            [sequenceProtectAddress, true]
          );
       
          const txApprove = {
            to: ERC1155Contract,
            data: dataApprove,
          };

          try {
            result = await signer.sendTransaction(txApprove)
        } catch (err) {
            console.error(`ERROR: ${err}`)
            throw err
        }

        }
        
        res.send({
            txHash: result.hash,
            verificationUrl: `https://sepolia.arbiscan.io/tx/${result.hash}`
        })
    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }
})


app.post('/retrieveWrappedMetadata', async (req: any,res: any) => {

    // Endpoint to mint a collectible to the provided wallet address
        try {
            // Get the wallet address from the request body
            const { wrappedTokenId } = req.body
    
            const chainHandle = "arbitrum-sepolia"

        const chainConfig: NetworkConfig = findSupportedNetwork(chainHandle)!
        const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl)
            
            // Sequence Protect Contract
    
            // Define the chain handle, contract address, amount, and signer
            // Modify these variables based on your contract and requirements
    
            // Get the signer for the provided chain handle
            const signer = await getSigner(chainHandle)
            
            let collectibleInterface;
            let data;
    
            // Standard interface for an ERC721 contract deployed via Sequence Builder
            // If you are using an ERC1155 or a different contract, you will need to update this interface
            // Standard interface for ERC1155 contract deployed via Sequence Builder
            collectibleInterface = new ethers.Interface([
                "function metadata(address clawbackAddr, uint256 wrappedTokenId) external view returns (string)"
            ])



            const contractABI = [
                // Add only the relevant ABI of the function you want to call
                "function metadata(address clawbackAddr, uint256 wrappedTokenId) external view returns (string)"
            ];

            const contract = new ethers.Contract(sequenceProtectMetadataAddress, contractABI, provider);

            let result 
            try {
                // Call the 'metadata' function
                const metadata = await contract.metadata(sequenceProtectAddress, wrappedTokenId);

                result = decodeBase64(metadata)
            } catch (error) {
                console.error("Error fetching metadata:", error);
            }


            
            res.send({
                wrappedTokenMetadata: result,
            })
        }catch(err){
            console.log(err)
            res.sendStatus(500)
        }
    })



// Endpoint to mint a collectible to the provided wallet address
// This endpoint will mint 1 collectible to the provided wallet address
app.post('/wrap', async (req: any,res: any) => {
    try {
        // Get the wallet address from the request body
        const { walletAddress } = req.body

        // Define the chain handle, contract address, amount, and signer
        // Modify these variables based on your contract and requirements
        const chainHandle = "arbitrum-sepolia"
        // Sequence Protect Contract
        const amount = 1

        // Get the signer for the provided chain handle
        const signer = await getSigner(chainHandle)

        // Validate the provided wallet address
        if (!isValidEthereumAddress(walletAddress)) {
            return res.status(400).send({ error: "Please provide a valid EVM wallet address" });
        }

        // Approval Logic - covers ERC1155

        // const erc1155Interface = new ethers.Interface([
        //     "function setApprovalForAll(address _operator, bool _approved) returns ()",
        //   ]);
       
        //   // Give approval permissions to Sequence Protect
        //   const dataApprove = erc1155Interface.encodeFunctionData(
        //     "setApprovalForAll",
        //     ["0x6F9a2c3E11011b894fae691d5338748f8048467d", true]
        //   );
       
        //   const txApprove = {
        //     to: sequenceProtectAddress,
        //     data: dataApprove,
        //   };







        // Wrapping Logic
        let wrapInterface;
        let data;

        // Standard interface for an ERC721 contract deployed via Sequence Builder
        // If you are using an ERC1155 or a different contract, you will need to update this interface
        wrapInterface = new ethers.Interface([
            'function wrap(uint32 templateId, uint8 tokenType, address tokenAddr, uint256 tokenId, uint256 amount, address receiver)'
        ])

        data = wrapInterface.encodeFunctionData(
            'wrap', [0, 2, '0x95d0c2907f2aa65561c0f217a78f9a366f9205f8', 0, 1, `${walletAddress}`]
        )

        // Construct the transaction object
        const txn = {
            to: sequenceProtectAddress, 
            data: data
        }

        // Send the transaction
        // If you are on a testnet, gas will be sponsored by Sequence
        // For mainnet contracts, make sure to import your contract at sequence.build
        // and sponsor it using the Gas Sponsorship feature
        let result;

        try {
            result = await signer.sendTransaction(txn)
        } catch (err) {
            console.error(`ERROR: ${err}`)
            throw err
        }
        
        res.send({
            txHash: result.hash,
            verificationUrl: `https://sepolia.arbiscan.io/tx/${result.hash}`
        })
    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }
})

app.post("/create-payment-intent", async (req, res) => {
    const { items } = req.body;
  
    try {
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(items),
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
        });
  
        res.send({
            clientSecret: paymentIntent.client_secret,
            dpmCheckerLink: `https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=${paymentIntent.id}`,
        });
    } catch (error) {
        console.log(error)
        console.error(`Stripe Error: ${error.message}`);
        res.status(500).send({ error: 'Failed to create payment intent' });
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})
