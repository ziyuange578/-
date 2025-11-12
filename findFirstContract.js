const Web3 = require('web3');

// 重要：将 YOUR_INFURA_PROJECT_ID 替换为您的真实 Infura 项目 ID
const web3 = new Web3('https://mainnet.infura.io/v3/72df547f74444a62adac13c50b136860');

async function findFirstContractCreation() {
    console.log("开始搜索第一个合约创建交易...");
    console.log("这可能需要几分钟时间...");

    try {
        // 获取当前区块号
        const currentBlock = await web3.eth.getBlockNumber();
        console.log(`当前区块号: ${currentBlock}`);

        // 从区块 0 开始搜索
        let blockNumber = 0;

        while (blockNumber <= currentBlock) {
            try {
                // 获取包含完整交易信息的区块
                const block = await web3.eth.getBlock(blockNumber, true);

                if (block && block.transactions) {
                    // 检查该区块中的所有交易
                    for (const tx of block.transactions) {
                        // 合约创建交易的 'to' 地址为 null
                        if (tx.to === null) {
                            console.log(`\n>>> 成功找到第一个合约创建交易! <<<`);
                            console.log(`区块号: ${block.number}`);
                            console.log(`区块哈希: ${block.hash}`);
                            console.log(`交易哈希: ${tx.hash}`);
                            console.log(`创建者: ${tx.from}`);
                            console.log(`时间戳: ${new Date(block.timestamp * 1000)}`);
                            return;
                        }
                    }
                }

                // 每 1000 个区块显示进度
                if (blockNumber % 1000 === 0) {
                    console.log(`已搜索到区块 ${blockNumber}...`);
                }

                blockNumber++;
            } catch (error) {
                console.log(`在区块 ${blockNumber} 遇到错误:`, error.message);
                blockNumber++; // 继续下一个区块
            }
        }

        console.log("未找到合约创建交易。");
    } catch (error) {
        console.error("程序执行出错:", error);
    }
}

// 运行搜索函数
findFirstContractCreation();