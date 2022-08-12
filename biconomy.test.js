const ethers = require("ethers");
const { getJsonWalletAddress } = require("ethers/lib/utils");

const { BigNumber, utils } = ethers;
const INFURA_ID = "";
const TO_WALLET_PRIVATE_KEY = "";
const FROM_WALLET_PRIVATE_KEY = "";

const provider = new ethers.providers.JsonRpcProvider(
  `https://goerli.infura.io/v3/${INFURA_ID}`
);

const fromWallet = new ethers.Wallet(FROM_WALLET_PRIVATE_KEY, provider);
const toWallet = new ethers.Wallet(TO_WALLET_PRIVATE_KEY, provider);

test("Verify successful wallet transfer", async () => {
  const beforeFromWalletBalance = await fromWallet.getBalance("latest");
  const gasPrice = await provider.getGasPrice();
  const gasLimit = 21000;
  const maxGasFee = BigNumber.from(gasLimit).mul(gasPrice);
  const value = beforeFromWalletBalance.sub(maxGasFee);

  const transaction = {
    to: await toWallet.getAddress(),
    value: value,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  };

  const txn = await fromWallet.sendTransaction(transaction);
  await txn.wait();

  expect(txn.from).toBe(await fromWallet.getAddress());
  expect(txn.to).toBe(await toWallet.getAddress());
  expect(utils.formatEther(txn.value)).toBe(utils.formatEther(value));

  const afterFromWalletBalance = await fromWallet.getBalance("latest");
  const afterToWalletBalance = await toWallet.getBalance("latest");

  expect(utils.formatEther(afterFromWalletBalance)).toBe("0.0");
  expect(utils.formatEther(afterToWalletBalance)).toBe(
    utils.formatEther(value)
  );
}, 60000);

test("Verify wallet transfer when user has 0 balance", async () => {
  const beforeFromWalletBalance = await fromWallet.getBalance("latest");

  if (utils.formatEther(beforeFromWalletBalance) > 0) {
    const txn = await fromWallet.sendTransaction({
      to: await toWallet.getAddress(),
      value: beforeFromWalletBalance,
    });
    await txn.wait();
  }

  const transaction = {
    to: await toWallet.getAddress(),
    value: beforeFromWalletBalance,
  };

  try {
    const txn = await fromWallet.sendTransaction(transaction);
    await txn.wait();
  } catch (err) {
    expect(err.reason).toBe(
      "insufficient funds for intrinsic transaction cost"
    );
    expect(err.code).toBe("INSUFFICIENT_FUNDS");
  }
}, 60000);

test("Verify wallet transfer with negative value", async () => {
  const beforeFromWalletBalance = await fromWallet.getBalance("latest");
  const value = beforeFromWalletBalance.sub(beforeFromWalletBalance.add(1));

  const transaction = {
    to: await toWallet.getAddress(),
    value: beforeFromWalletBalance,
  };

  try {
    const txn = await fromWallet.sendTransaction(transaction);
    await txn.wait();
  } catch (err) {
    expect(err.reason).toBe(
      "insufficient funds for intrinsic transaction cost"
    );
    expect(err.code).toBe("INSUFFICIENT_FUNDS");
  }
}, 60000);

test("Verify wallet transfer with more value than user actually has", async () => {
  const beforeFromWalletBalance = await fromWallet.getBalance("latest");
  const gasPrice = await provider.getGasPrice();
  const gasLimit = 21000;
  const value = beforeFromWalletBalance.add(1);

  const transaction = {
    to: await toWallet.getAddress(),
    value: value,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  };

  try {
    const txn = await fromWallet.sendTransaction(transaction);
    await txn.wait();
  } catch (err) {
    expect(err.reason).toBe(
      "insufficient funds for intrinsic transaction cost"
    );
    expect(err.code).toBe("INSUFFICIENT_FUNDS");
  }
}, 60000);

test("Verify wallet transfer to the users own wallet", async () => {
  const walletBalance = await toWallet.getBalance("latest");
  const gasPrice = await provider.getGasPrice();
  const gasLimit = 21000;
  const maxGasFee = BigNumber.from(gasLimit).mul(gasPrice);
  const value = walletBalance.sub(maxGasFee);

  const transaction = {
    to: await toWallet.getAddress(),
    value: value,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  };

  try {
    const txn = await fromWallet.sendTransaction(transaction);
    await txn.wait();
  } catch (err) {
    expect(err.reason).toBe(
      "insufficient funds for intrinsic transaction cost"
    );
    expect(err.code).toBe("INSUFFICIENT_FUNDS");
  }
}, 60000);
