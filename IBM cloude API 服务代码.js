// ibm-deployment/api-service/src/server.js
const express = require('express');
const Web3 = require('web3');
const { ethers } = require('ethers');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP限制100个请求
});
app.use('/api/', limiter);

// 初始化Web3
const web3 = new Web3(process.env.ETH_NODE_URL || 'http://localhost:8545');
const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETH_NODE_URL || 'http://localhost:8545'
);

// 合约实例
const CONTRACT_ABI = require('../contracts/Casino.json').abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
let casinoContract, casinoEthersContract;

// 初始化合约
async function initContracts() {
  try {
    casinoContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    casinoEthersContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CON