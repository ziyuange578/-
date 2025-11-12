pragma solidity ^0.5.1;
import "./ERC20.sol";

contract XYZCoin is ERC20 {
    string public name = "XYZCoin";
    string public symbol = "XYZ";
    uint8 public decimals = 0;
    uint256 public totalSupply;

    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;

    address public owner;

    constructor() public {
        owner = msg.sender;
        balances[msg.sender] = totalSupply = 1000; // Give all initial tokens to the deployer
        emit Transfer(address(0), msg.sender, totalSupply); // Minting event
    }

    function balanceOf(address tokenOwner) external view returns (uint256 balance) {
        return balances[tokenOwner];
    }

    function transfer(address to, uint256 tokens) external returns (bool success) {
        require(tokens <= balances[msg.sender], "Insufficient balance");
        balances[msg.sender] -= tokens;
        balances[to] += tokens;
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    function approve(address spender, uint256 tokens) external returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }

    function allowance(address tokenOwner, address spender) external view returns (uint256 remaining) {
        return allowed[tokenOwner][spender];
    }

    function transferFrom(address from, address to, uint256 tokens) external returns (bool success) {
        require(tokens <= balances[from], "Insufficient balance");
        require(tokens <= allowed[from][msg.sender], "Allowance exceeded");
        balances[from] -= tokens;
        allowed[from][msg.sender] -= tokens;
        balances[to] += tokens;
        emit Transfer(from, to, tokens);
        return true;
    }
}