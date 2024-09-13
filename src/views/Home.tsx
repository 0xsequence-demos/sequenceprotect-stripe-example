import { useAccount } from "wagmi";

import "./Home.css";
import NotConnected from "./components/blockchain/NotConnected";
import { Text } from "@0xsequence/design-system";
import Connected from "./components/blockchain/Connected";

const Home = () => {
  const { isConnected } = useAccount();

  return (
    <div>
      <h1>Purchasing an NFT using Stripe Payments</h1>
      <h2 className="homepage__marginBtNormal">Secured by Sequence Protect</h2>
      {isConnected ? <Connected /> : <NotConnected />}
      <footer className="homepage__footer">
        <Text>
          Want to learn more? Read the{" "}
          <a
            href={
              "https://docs.sequence.xyz/solutions/wallets/sequence-kit/overview/"
            }
            target="_blank"
            rel="noreferrer "
          >
            docs
          </a>
          !
        </Text>
      </footer>
    </div>
  );
};

export default Home;
