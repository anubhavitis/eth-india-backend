require("dotenv").config();
const web3 = require("web3");
const express = require("express");
const Tx = require("ethereumjs-tx").Transaction;
const users = require('./data.json');
const CONTRACT_ABI = require("./storage-abi.json");
const {
  default: Common,
  Chain,
  Hardfork,
  CustomChain,
} = require("@ethereumjs/common");
const app = express();
const nftNames = ["punk_ft", "cool_ft", "dope_ft", "sly_ft", "cry_ft", "done_ft", "bomb_ft", "just_ft"];
//Infura HttpProvider Endpoint
web3js = new web3(
  new web3.providers.HttpProvider("https://matic-mumbai.chainstacklabs.com")
);

const common = Common.custom(CustomChain.PolygonMumbai);

//addresses
const contractAddress = process.env.CONTRACT_ADDRESS;
console.log(process.env.CONTRACT_ADDRESS);
const adminAddress = "0xe2fF75F5D264a68D1E561A27b4Cdb886f5C8ac50";
const user1Address = "0xe196C91ABFb4DFba4c57704C530Be52C3c3ddD9B";
const user2Address = "0xB63Cf430fe1Ca8d80dff1F714B71fD688e8F5F6d";

const adminPrivateAddress = Buffer.from(
  "78481e093cfec33328a6d9399ba63147527b7b5c8d71071f96647781fb464e9d",
  "hex"
);

var contract = new web3js.eth.Contract(CONTRACT_ABI, contractAddress);
async function getTransactionCount(address) {
    const result = await web3js.eth.getTransactionCount(address);
    return result;
}

var cors = require("cors");

app.use(cors());

app.get("/get-user-data", async (req, res) => {
    const id = req.query.id;
    const user = users.users.find((user) => parseInt(id) === user.id);
    const userId = user.publicKey;
    const nftCount = await contract.methods.totalSupply().call();
    const userNfts = [];
    for(let i = 0; i <= parseInt(nftCount); i++) {
        const ownerAddress = await contract.methods.nftToOwner(i).call();
        if(ownerAddress && String(ownerAddress) === String(userId)) {
            const {name, dna, level, readyTime, winCount, lossCount } = await contract.methods.nfts(i).call();
            userNfts.push({ name, dna, level, readyTime, winCount, lossCount });
        }
    }
    return res.json(200, { userId, userNfts });
});

const sendTransaction = (transaction) =>
  new Promise((res, rej) => {
    // console.log(transaction.toString());
    web3js.eth
      .sendSignedTransaction("0x" + transaction.serialize().toString("hex"))
      .on("transactionHash", (hash) => {
        res(hash);
        // res.status(200).json({ message: "Transaction successful", transactionId: hash })
      });
  });

app.get("/mint-tokens", async (req, res) => {
  const { level } = req.query;
  const userInLevel = users.users.find((user) => user.level === parseInt(level));
  if(userInLevel) {

    const count = await getTransactionCount(adminAddress);
    console.log(count);
    // var amount = web3js.utils.toHex(1e16);
    //creating raw tranaction
    // const nftName = nftNames[Math.floor(Math.random() * nftNames.length)];
    var rawTransaction = {
        from: adminAddress,
        to: contractAddress,
        value: "0x0",
        gasPrice: web3js.utils.toHex(30 * 1e9),
        gasLimit: web3js.utils.toHex(310000),
        data: contract.methods
        .mintNft("0xe196C91ABFb4DFba4c57704C530Be52C3c3ddD9B", "new1", 1234, "new1")
        .encodeABI(),
        nonce: web3js.utils.toHex(count),
    };
    console.log(rawTransaction);
    //creating tranaction via ethereumjs-tx
    var transaction = new Tx(rawTransaction, { common: common });
    //signing transaction with private key
    transaction.sign(adminPrivateAddress);
    //sending transacton via web3js module

    const hash = await sendTransaction(transaction)
    res
        .status(200)
        .json({ message: "Transaction successful", transactionId: hash });
  }
});

app.listen(3030, () => console.log("Example app listening on port 3030!"));
