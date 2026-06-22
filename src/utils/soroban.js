
export const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatAmount = (stroops) => {
  return (Number(stroops) / 10000000).toFixed(2);
};
