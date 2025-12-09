// aws-deployment/lambda/index.js
const AWS = require('aws-sdk');
const Web3 = require('web3');
const { AbiCoder } = require('ethers');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// 智能合约ABI
const CASINO_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_number",
        "type": "uint256"
      }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "completeRoundManually",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentRound",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalBets",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalAmount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct Casino.RoundInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalPrizePool",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

exports.handler = async (event) => {
  try {
    const { action, body } = event;
    const web3 = new Web3(process.env.ETH_NODE_URL);
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const contract = new web3.eth.Contract(CASINO_ABI, contractAddress);
    
    // 从环境变量获取私钥（生产环境使用Secrets Manager）
    const privateKey = process.env.PRIVATE_KEY;
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    
    switch (action) {
      case 'placeBet': {
        const { playerAddress, number, amount, signature } = body;
        
        // 验证签名
        const recoveredAddress = web3.eth.accounts.recover(
          web3.utils.soliditySha3(
            { type: 'uint256', value: number.toString() },
            { type: 'uint256', value: amount.toString() }
          ),
          signature
        );
        
        if (recoveredAddress.toLowerCase() !== playerAddress.toLowerCase()) {
          throw new Error('Invalid signature');
        }
        
        // 发送交易
        const txData = contract.methods.placeBet(number).encodeABI();
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.placeBet(number)
          .estimateGas({ value: web3.utils.toWei(amount.toString(), 'ether') });
        
        const tx = {
          from: account.address,
          to: contractAddress,
          gas: gasEstimate,
          gasPrice,
          value: web3.utils.toWei(amount.toString(), 'ether'),
          data: txData,
          nonce: await web3.eth.getTransactionCount(account.address)
        };
        
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        // 保存到DynamoDB
        await dynamodb.put({
          TableName: process.env.BETS_TABLE,
          Item: {
            id: receipt.transactionHash,
            playerAddress,
            number,
            amount,
            timestamp: Date.now(),
            blockNumber: receipt.blockNumber,
            status: 'PENDING'
          }
        }).promise();
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber
          })
        };
      }
        
      case 'getCurrentRound': {
        const roundInfo = await contract.methods.getCurrentRound().call();
        const totalPrize = await contract.methods.getTotalPrizePool().call();
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            roundId: roundInfo.id,
            totalBets: roundInfo.totalBets,
            totalPrize: web3.utils.fromWei(totalPrize, 'ether'),
            isActive: roundInfo.isActive
          })
        };
      }
        
      case 'getTransactionStatus': {
        const { txHash } = body;
        const tx = await web3.eth.getTransactionReceipt(txHash);
        
        // 从DynamoDB获取详情
        const result = await dynamodb.get({
          TableName: process.env.BETS_TABLE,
          Key: { id: txHash }
        }).promise();
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            status: tx ? (tx.status ? 'CONFIRMED' : 'FAILED') : 'PENDING',
            details: result.Item
          })
        };
      }
        
      default:
        throw new Error('Invalid action');
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};