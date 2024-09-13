import React, { useState, useEffect } from 'react';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  Box,
  ThemeProvider,
  Card,
  Button,
  Image,
  Collapsible,
  Modal,
  Spinner,
  Text,
  TextInput,
} from "@0xsequence/design-system";
import CheckoutForm from './CheckoutForm';

const stripePromise = loadStripe("pk_test_46zswMCbz39W2KAqKj43vDRu");

const StripeCheckout = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [dpmCheckerLink, setDpmCheckerLink] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal visibility

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch("http://localhost:4242/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: "xl-tshirt", amount: 1000 }] }),
    })
      .then((res) => res.json())
      .then((data) => { 
        setClientSecret(data.clientSecret);
        // [DEV] For demo purposes only
        setDpmCheckerLink(data.dpmCheckerLink);
      });
  }, []);

  const appearance = {
    theme: "night",
  };
  const options = {
    clientSecret,
    appearance,
  };

  const onClickBuy = () => {
    setIsModalOpen(true)
  }

  

  return (
    <>
    <ThemeProvider>
      <Card> {/* Card container */}
        <Image src="https://metadata.sequence.app/projects/4859/collections/740/tokens/0/image.png" alt="Treasure Chest" /> {/* Image inside the card */}
        <div className="flex justify-center"> {/* Wrapper div to center the button using Tailwind */}
          <Button 
            size="sm" 
            variant="primary" 
            label="Purchase with Stripe" 
            shape="square" 
            width="1/2" 
            onClick={onClickBuy}
          >
            Pay with Stripe
          </Button> {/* Button to open modal */}
        </div>
      </Card>
      {isModalOpen && (
        <Modal
        label="Checkout with Stripe"
        display="flex"
        flexDirection="column"
        gap="8"
        isOpen={isModalOpen} // Control modal visibility
        onClose={() => {
          setIsModalOpen(false)
        }} // Close modal handler
      >
            <Box padding={'4'} paddingTop="12" flexDirection="column" gap="5">

        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
      <CheckoutForm  closeModal={() => {
              setIsModalOpen(false)
            }} dpmCheckerLink={dpmCheckerLink}/>
          </Elements>
        )}
        </Box>
      </Modal>
      )}
      </ThemeProvider>
    </>
  );
};

export default StripeCheckout;