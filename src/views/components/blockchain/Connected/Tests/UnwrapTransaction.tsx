import { Box, Text } from "@0xsequence/design-system";
import { useEffect, useState } from "react";
import { Chain } from "viem";
import { useAccount, useSendTransaction, useWalletClient } from "wagmi";
import chains from "../../../../../utils/chains";
import { ethers } from 'ethers'
import CardButton from "../../../CardButton";
import ErrorToast from "../../../ErrorToast";

const UnwrapTransaction = () => {
  const { data: walletClient } = useWalletClient();
  const { chainId } = useAccount();
  const [network, setNetwork] = useState<Chain | null>(null);
  const {
    data: txnData,
    sendTransaction,
    isPending: isPendingSendTxn,
    error,
    reset,
  } = useSendTransaction();
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);

  useEffect(() => {
    if (txnData) {
      setLastTransaction(txnData);
    }
    if (error) console.error(error);
  }, [txnData, error]);

  useEffect(() => {
    if (!chainId) return;
    const chainResult = chains.find((chain) => chain.id === chainId);
    if (chainResult) {
      setNetwork(chainResult);
    }
  }, [chainId]);

  const runSendTransaction = async () => {
    const [account] = await walletClient!.getAddresses();

        const unwrapInterface = new ethers.utils.Interface([
      'function unwrap(uint256 wrappedTokenId, address holder, uint256 amount)'
  ])

  const data = unwrapInterface.encodeFunctionData(
    'unwrap', [4, '0x2A431AE75506692344ab10063f5B807E3BBcE966', 1]
)

console.log(data)

  sendTransaction({
    to: '0x6F9a2c3E11011b894fae691d5338748f8048467d',
    data
  })

  };

  return (
    <>
      <CardButton
        title="Unwrap your token"
        description="The unlock period has lapsed and you can now retrieve your token!"
        isPending={isPendingSendTxn}
        onClick={runSendTransaction}
      />
      {lastTransaction && (
        <Box display="flex" flexDirection="column" gap="4">
          <Text>Last transaction hash: {lastTransaction}</Text>
          <button>
            <a
              target="_blank"
              href={`${network?.blockExplorers?.default?.url}/tx/${lastTransaction}`}
            >
              Click to view on {network?.name}
            </a>
          </button>
        </Box>
      )}
      {error && (
        <ErrorToast message={error?.message} onClose={reset} duration={7000} />
      )}
    </>
  );
};

export default UnwrapTransaction;
