import { Box } from "@0xsequence/design-system";
import StripeCheckout from "./StripeCheckout";

const Tests = (props: { chainId: number }) => {
  const { chainId } = props;
  return (
    <Box display="flex" flexDirection="column" gap="4">
      <StripeCheckout />
    </Box>
  );
};

export default Tests;
