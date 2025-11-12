const XYZCoin = artifacts.require("XYZCoin");
const truffleAssert = require('truffle-assertions');

contract("XYZCoin Advanced Tests", async (accounts) => {
    const [owner, alice, bob, charlie] = accounts;
    let xyzCoinInstance;

    beforeEach(async () => {
        xyzCoinInstance = await XYZCoin.new();
    });

    // 测试 1: 检查 Transfer 事件是否触发
    it("transfer() 函数必须触发 Transfer 事件", async () => {
        const transferAmount = 100;

        // 执行转账并捕获交易收据
        const tx = await xyzCoinInstance.transfer(alice, transferAmount, { from: owner });

        // 使用 truffle-assertions 检查事件
        truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
            return ev.from === owner && 
                   ev.to === alice && 
                   ev.tokens.toString() === transferAmount.toString();
        }, 'Transfer 事件应该被触发且参数正确');
    });

    // 测试 2: 检查 Approval 事件是否触发
    it("approve() 函数必须触发 Approval 事件", async () => {
        const allowanceAmount = 50;

        // 执行授权并捕获交易收据
        const tx = await xyzCoinInstance.approve(bob, allowanceAmount, { from: owner });

        // 检查 Approval 事件
        truffleAssert.eventEmitted(tx, 'Approval', (ev) => {
            return ev.tokenOwner === owner && 
                   ev.spender === bob && 
                   ev.tokens.toString() === allowanceAmount.toString();
        }, 'Approval 事件应该被触发且参数正确');
    });

    // 测试 3: 检查 transferFrom() 函数触发 Transfer 事件
    it("transferFrom() 函数必须触发 Transfer 事件", async () => {
        const transferAmount = 25;

        // 准备测试数据
        await xyzCoinInstance.transfer(alice, 100, { from: owner });
        await xyzCoinInstance.approve(bob, 50, { from: alice });

        // 执行 transferFrom
        const tx = await xyzCoinInstance.transferFrom(alice, charlie, transferAmount, { from: bob });

        // 检查 Transfer 事件
        truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
            return ev.from === alice && 
                   ev.to === charlie && 
                   ev.tokens.toString() === transferAmount.toString();
        }, 'Transfer 事件应该被触发且参数正确');
    });

    // 测试 4: 余额不足时应该回滚交易
    it("余额不足时转账应该回滚交易", async () => {
        const hugeAmount = 9999;

        // 使用 truffle-assertions 检查交易是否回滚
        await truffleAssert.reverts(
            xyzCoinInstance.transfer(bob, hugeAmount, { from: alice }),
            "余额不足",
            "余额不足时转账应该回滚"
        );
    });

    // 测试 5: 未授权时 transferFrom 应该回滚
    it("未授权账户尝试 transferFrom 应该回滚交易", async () => {
        // 给 Alice 一些代币，但不授权给 Charlie
        await xyzCoinInstance.transfer(alice, 100, { from: owner });

        // Charlie 尝试在未授权的情况下从 Alice 转账
        await truffleAssert.reverts(
            xyzCoinInstance.transferFrom(alice, bob, 10, { from: charlie }),
            "授权额度不足",
            "未授权时 transferFrom 应该回滚"
        );
    });

    // 测试 6: 零值转账也应该触发 Transfer 事件
    it("零值转账必须触发 Transfer 事件", async () => {
        const zeroAmount = 0;

        // 执行零值转账
        const tx = await xyzCoinInstance.transfer(alice, zeroAmount, { from: owner });

        // 检查 Transfer 事件（即使是零值）
        truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
            return ev.from === owner && 
                   ev.to === alice && 
                   ev.tokens.toString() === zeroAmount.toString();
        }, '零值转账也应该触发 Transfer 事件');
    });

    // 测试 7: 超过余额的 transferFrom 应该回滚
    it("超过余额的 transferFrom 应该回滚", async () => {
        const excessAmount = 150; // 超过 Alice 的余额

        // 准备测试数据
        await xyzCoinInstance.transfer(alice, 100, { from: owner });
        await xyzCoinInstance.approve(bob, 200, { from: alice }); // 授权足够，但余额不足

        // 尝试转账超过余额的数量
        await truffleAssert.reverts(
            xyzCoinInstance.transferFrom(alice, charlie, excessAmount, { from: bob }),
            "余额不足",
            "超过余额的 transferFrom 应该回滚"
        );
    });

    // 测试 8: 向零地址转账应该回滚
    it("向零地址转账应该回滚交易", async () => {
        const zeroAddress = "0x0000000000000000000000000000000000000000";

        await truffleAssert.reverts(
            xyzCoinInstance.transfer(zeroAddress, 10, { from: owner }),
            "不能转账到零地址",
            "向零地址转账应该回滚"
        );
    });

    // 测试 9: 检查事件参数是否正确
    it("Transfer 事件应该包含正确的参数", async () => {
        const transferAmount = 75;

        const tx = await xyzCoinInstance.transfer(alice, transferAmount, { from: owner });

        // 使用 truffle-assertions 的 eventEmitted 详细检查
        truffleAssert.eventEmitted(tx, 'Transfer', {
            from: owner,
            to: alice,
            tokens: transferAmount
        }, 'Transfer 事件参数应该完全匹配');
    });
});