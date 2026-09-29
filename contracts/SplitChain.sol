// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SplitChain
/// @notice Create reusable native-BOT payment splits and distribute funded balances.
contract SplitChain {
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_RECIPIENTS = 50;

    struct Split {
        address owner;
        string name;
        address[] recipients;
        uint16[] sharesBps;
        uint256 balance;
        uint256 totalDeposited;
        uint256 totalDistributed;
        uint256 distributionCount;
    }

    uint256 public nextSplitId;
    mapping(uint256 => Split) private splits;
    uint256 private locked = 1;

    error EmptyName();
    error NameTooLong();
    error InvalidRecipientCount();
    error ArrayLengthMismatch();
    error ZeroAddress();
    error DuplicateRecipient();
    error InvalidShare();
    error InvalidTotalPercentage(uint256 totalBps);
    error SplitNotFound();
    error Unauthorized();
    error ZeroDeposit();
    error NothingToDistribute();
    error TransferFailed(address recipient);
    error Reentrancy();
    error DirectPaymentsDisabled();

    event SplitCreated(uint256 indexed splitId, address indexed owner, string name);
    event Deposited(uint256 indexed splitId, address indexed sender, uint256 amount);
    event PaymentReleased(uint256 indexed splitId, address indexed recipient, uint256 amount);
    event Distributed(uint256 indexed splitId, address indexed owner, uint256 amount, uint256 distributionNumber);

    modifier existingSplit(uint256 splitId) {
        if (splits[splitId].owner == address(0)) revert SplitNotFound();
        _;
    }

    modifier onlySplitOwner(uint256 splitId) {
        if (splits[splitId].owner != msg.sender) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (locked != 1) revert Reentrancy();
        locked = 2;
        _;
        locked = 1;
    }

    function createSplit(
        string calldata name,
        address[] calldata recipients,
        uint16[] calldata sharesBps
    ) external returns (uint256 splitId) {
        uint256 nameLength = bytes(name).length;
        if (nameLength == 0) revert EmptyName();
        if (nameLength > 64) revert NameTooLong();
        if (recipients.length < 2 || recipients.length > MAX_RECIPIENTS) revert InvalidRecipientCount();
        if (recipients.length != sharesBps.length) revert ArrayLengthMismatch();

        uint256 totalBps;
        for (uint256 i; i < recipients.length; ++i) {
            address recipient = recipients[i];
            if (recipient == address(0)) revert ZeroAddress();
            if (sharesBps[i] == 0) revert InvalidShare();
            totalBps += sharesBps[i];

            for (uint256 j; j < i; ++j) {
                if (recipients[j] == recipient) revert DuplicateRecipient();
            }
        }
        if (totalBps != BPS_DENOMINATOR) revert InvalidTotalPercentage(totalBps);

        splitId = nextSplitId++;
        Split storage newSplit = splits[splitId];
        newSplit.owner = msg.sender;
        newSplit.name = name;
        newSplit.recipients = recipients;
        newSplit.sharesBps = sharesBps;

        emit SplitCreated(splitId, msg.sender, name);
    }

    function deposit(uint256 splitId) external payable existingSplit(splitId) {
        if (msg.value == 0) revert ZeroDeposit();
        Split storage split = splits[splitId];
        split.balance += msg.value;
        split.totalDeposited += msg.value;
        emit Deposited(splitId, msg.sender, msg.value);
    }

    function distribute(uint256 splitId)
        external
        existingSplit(splitId)
        onlySplitOwner(splitId)
        nonReentrant
    {
        Split storage split = splits[splitId];
        uint256 amount = split.balance;
        if (amount == 0) revert NothingToDistribute();

        split.balance = 0;
        split.totalDistributed += amount;
        uint256 distributionNumber = ++split.distributionCount;

        uint256 released;
        uint256 lastIndex = split.recipients.length - 1;
        for (uint256 i; i < split.recipients.length; ++i) {
            uint256 payment = i == lastIndex
                ? amount - released
                : (amount * split.sharesBps[i]) / BPS_DENOMINATOR;
            released += payment;

            (bool success,) = payable(split.recipients[i]).call{value: payment}("");
            if (!success) revert TransferFailed(split.recipients[i]);
            emit PaymentReleased(splitId, split.recipients[i], payment);
        }

        emit Distributed(splitId, msg.sender, amount, distributionNumber);
    }

    function getSplit(uint256 splitId)
        external
        view
        existingSplit(splitId)
        returns (
            address owner,
            string memory name,
            address[] memory recipients,
            uint16[] memory sharesBps,
            uint256 balance,
            uint256 totalDeposited,
            uint256 totalDistributed,
            uint256 distributionCount
        )
    {
        Split storage split = splits[splitId];
        return (
            split.owner,
            split.name,
            split.recipients,
            split.sharesBps,
            split.balance,
            split.totalDeposited,
            split.totalDistributed,
            split.distributionCount
        );
    }

    receive() external payable {
        revert DirectPaymentsDisabled();
    }
}
