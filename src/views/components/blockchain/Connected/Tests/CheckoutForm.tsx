import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import UnwrapTransaction from "./UnwrapTransaction";
import {
  Card,
  Button,
} from "@0xsequence/design-system";
import { ethers } from 'ethers'
import { useAccount, useWriteContract, useSimulateContract, useSendTransaction } from 'wagmi';

interface CheckoutFormProps {
  dpmCheckerLink: string;
  closeModal: () => void
}


export default function CheckoutForm({ dpmCheckerLink }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { address } = useAccount();

  const [message, setMessage] = useState<string>(''); // Specify type as string
  const [isLoading, setIsLoading] = useState<boolean>(false); // Specify type as boolean
  const [wrappedMetadata, setWrappedMetadata] = useState<any>(null); // State to hold wrapped metadata

  // // Prepare the contract write
  // const { txdata } = useSimulateContract({
  //   address: '0x6F9a2c3E11011b894fae691d5338748f8048467d', // Replace with your actual contract address
  //   abi: unwrapABI,
  //   functionName: 'unwrap',
  //   args: [0, address, 1], // wrappedTokenId: 0, holder: user's address, amount: 1
  // });
  // Use the contract write hook

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Specify event type
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "http://localhost:4444",
      },
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment succeeded!');
      await handlePostPaymentActions();
    }

    setIsLoading(false);
  };

  const handlePostPaymentActions = async () => {
    try {
      // Step 2: Send POST request to mint
      const mintResponse = await fetch('http://localhost:4242/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Mint tokens initially to relayer address to perform the wrapping
        body: JSON.stringify({ backendWalletAddress: '0xBB7823355f7f0A608030db8be25781a877033a96' }),
      });

      if (mintResponse.ok) {
        setMessage(prevMessage => `${prevMessage} Minting successful.`);

        // Step 3: Send POST request to wrap
        const wrapResponse = await fetch('http://localhost:4242/wrap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: address }),
        });

        console.log(wrapResponse)

        if (wrapResponse.ok) {
          setMessage(prevMessage => `${prevMessage} Wrapping successful.`);
          
          await retrieveWrappedMetadata(); // Call the new function after successful wrap
        } else {
          throw new Error('Wrapping failed');
        }
      } else {
        throw new Error('Minting failed');
      }
    } catch (err) {
      setMessage(`${message} Error: ${err.message}`);
    }
  };

  // New function to retrieve wrapped metadata
  const retrieveWrappedMetadata = async () => {
    try {
      const response = await fetch('http://localhost:4242/retrieveWrappedMetadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wrappedTokenId: 3 }),
      });

      if (response.ok) {
        const data = await response.json();
        setWrappedMetadata(data); // Set the data to state
      } else {
        throw new Error('Failed to retrieve wrapped metadata');
      }
    } catch (err) {
      setMessage(`${message} Error: ${err.message}`);
    }
  };
  

  const WrappedMetadataDisplay = ({ data }: { data: any }) => (
    <div>
      <h3>Wrapped Metadata</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre> {/* Render the metadata */}
    </div>
  );

  const paymentElementOptions = {
    layout: "tabs"
  }

  return (
    <>
      <form id="payment-form" onSubmit={handleSubmit}>
        <PaymentElement id="payment-element" options={paymentElementOptions} />
        <button disabled={isLoading || !stripe || !elements} id="submit">
          <span id="button-text">
            {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
          </span>
        </button>

        {/* Show any error or success messages */}
        {message && <div id="payment-message">{message}</div>}
      </form>
      <Card>
        {wrappedMetadata && <WrappedMetadataDisplay data={wrappedMetadata} />} {/* Pass isPending as a prop */}
        {wrappedMetadata &&  <UnwrapTransaction />
        }
      </Card>
      {/* [DEV]: Display dynamic payment methods annotation and integration checker */}
      <div id="dpm-annotation">
        <p>
          Payment methods are dynamically displayed based on customer location, order amount, and currency.&nbsp;
          <a href={dpmCheckerLink} target="_blank" rel="noopener noreferrer" id="dpm-integration-checker">Preview payment methods by transaction</a>
        </p>
      </div>
    </>
  );
}