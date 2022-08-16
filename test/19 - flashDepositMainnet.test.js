const { ethers } = require("hardhat");
const { utils } = ethers;
const {
    wethAddress,
    osqthAddress,
    usdcAddress,
    _governanceAddress,
    _flashDepositAddress,
    _vaultAddress,
    _biggestOSqthHolder,
    maxUint256,
} = require("./common");
const {
    resetFork,
    getERC20Balance,
    approveERC20,
    getERC20Allowance,
    getUSDC,
    getWETH,
    getOSQTH,
} = require("./helpers");
const { deployContract } = require("./deploy");
const { BigNumber } = require("ethers");

describe.only("Flash deposit", function () {
    let tx, receipt, FlashDeposit;
    let actor;
    let actorAddress = "0x6c4830e642159be2e6c5cc4c6012bc5a21aa95ce";

    it("Should set actors", async function () {
        await resetFork(15351855);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [actorAddress],
        });

        actor = await ethers.getSigner(actorAddress);
        console.log("actor:", actor.address);

        // MyContract = await ethers.getContractFactory("FlashDeposit");
        // FlashDeposit = await MyContract.attach(_flashDepositAddress);
        MyContract = await ethers.getContractFactory("Vault");
        Vault = await MyContract.attach(_vaultAddress);
        FlashDeposit = await deployContract("FlashDeposit", [], false);
        // tx = await FlashDeposit.setContracts(Vault.address);
        // await tx.wait();
    });

    it("flash deposit", async function () {
        this.skip();
        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        let amountEth = "5105085075218935";
        await approveERC20(actor, FlashDeposit.address, amountEth, wethAddress);

        tx = await FlashDeposit.connect(actor).deposit(
            amountEth,
            utils.parseUnits("99", 16),
            actor.address,
            "0",
            "0",
            "0"
        );
        await tx.wait();
        console.log("> deposit()");

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        console.log("> FlashDeposit Eth %s", await getERC20Balance(FlashDeposit.address, wethAddress));
        console.log("> FlashDeposit Usdc %s", await getERC20Balance(FlashDeposit.address, usdcAddress));
        console.log("> FlashDeposit Osqth %s", await getERC20Balance(FlashDeposit.address, osqthAddress));

        const signers = await ethers.getSigners();
        let governance = signers[0];
        tx = await FlashDeposit.connect(governance).collectRemains(
            "49151068761009",
            "5001895",
            "8974852826343",
            actor.address
        );
        await tx.wait();
        console.log("> collectProtocol()");

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        console.log("> FlashDeposit Eth %s", await getERC20Balance(FlashDeposit.address, wethAddress));
        console.log("> FlashDeposit Usdc %s", await getERC20Balance(FlashDeposit.address, usdcAddress));
        console.log("> FlashDeposit Osqth %s", await getERC20Balance(FlashDeposit.address, osqthAddress));
    });

    it("flash deposit real", async function () {
        // this.skip();
        // const flashDepositAddress = _flashDepositAddress;
        const flashDepositAddress = FlashDeposit.address;

        const [owner] = await ethers.getSigners();
        await owner.sendTransaction({
            to: actorAddress,
            value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
        });

        let WETH = await ethers.getContractAt("IWETH", wethAddress);
        tx = await WETH.connect(actor).approve(flashDepositAddress, BigNumber.from(maxUint256));
        await tx.wait();

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Eth a %s", await getERC20Allowance(actor.address, flashDepositAddress, wethAddress));
        // console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        // console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        // console.log("> user Eth a %s", await getERC20Allowance(flashDepositAddress, _vaultAddress, wethAddress));
        // console.log("> user Usdc a %s", await getERC20Allowance(flashDepositAddress, _vaultAddress, usdcAddress));
        // console.log("> user Osqth a %s", await getERC20Allowance(flashDepositAddress, _vaultAddress, osqthAddress));

        // await getWETH(utils.parseUnits("1", 18), actor.address);
        // await getUSDC(utils.parseUnits("100", 6), flashDepositAddress);
        // await getOSQTH(utils.parseUnits("1", 18), flashDepositAddress, _biggestOSqthHolder);

        console.log("> FlashDeposit Eth %s", await getERC20Balance(flashDepositAddress, wethAddress));
        console.log("> FlashDeposit Usdc %s", await getERC20Balance(flashDepositAddress, usdcAddress));
        console.log("> FlashDeposit Osqth %s", await getERC20Balance(flashDepositAddress, osqthAddress));

        const slippage = "999000000000000000";
        const amountETH = "4000000000000000";

        const ts = await Vault.totalSupply();
        const a = await Vault.calcSharesAndAmounts(
            BigNumber.from(amountETH).mul(BigNumber.from(slippage)).div(utils.parseUnits("1", 18)),
            0,
            0,
            ts,
            true
        );
        // console.log(a);

        tx = await FlashDeposit.connect(actor).deposit(amountETH, slippage, actorAddress, "0", "0", "0", "1");
        receipt = await tx.wait();
        console.log("> deposit()");
        console.log("> Gas used: %s", receipt.gasUsed);

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        console.log("> FlashDeposit Eth %s", await getERC20Balance(flashDepositAddress, wethAddress));
        console.log("> FlashDeposit Usdc %s", await getERC20Balance(flashDepositAddress, usdcAddress));
        console.log("> FlashDeposit Osqth %s", await getERC20Balance(flashDepositAddress, osqthAddress));
    });
});
