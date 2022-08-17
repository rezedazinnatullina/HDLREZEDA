const { ethers } = require("hardhat");
const { utils } = ethers;
const { expect, assert } = require("chai");
const {
    wethAddress,
    osqthAddress,
    usdcAddress,
    _governanceAddress,
    _oneClickDepositAddress,
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

describe.only("One Click deposit", function () {
    let tx, receipt, OneClickDeposit;
    let actor;
    let actorAddress = "0x6c4830e642159be2e6c5cc4c6012bc5a21aa95ce";

    it("Should set actors", async function () {
        await resetFork(15357811);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [actorAddress],
        });

        actor = await ethers.getSigner(actorAddress);
        console.log("actor:", actor.address);

        MyContract = await ethers.getContractFactory("OneClickDeposit");
        OneClickDeposit = await MyContract.attach(_oneClickDepositAddress);
        // MyContract = await ethers.getContractFactory("Vault");
        // Vault = await MyContract.attach(_vaultAddress);
        // OneClickDeposit = await deployContract("OneClickDeposit", [], false);
        // tx = await OneClickDeposit.setContracts(Vault.address);
        // await tx.wait();
    });

    it("flash deposit real (mode = 0)", async function () {
        // this.skip();
        const oneClickDepositAddress = _oneClickDepositAddress;
        // const oneClickDepositAddress = OneClickDeposit.address;

        const [owner] = await ethers.getSigners();
        await owner.sendTransaction({
            to: actorAddress,
            value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
        });

        let WETH = await ethers.getContractAt("IWETH", wethAddress);
        tx = await WETH.connect(actor).approve(oneClickDepositAddress, BigNumber.from(maxUint256));
        await tx.wait();

        await getWETH(utils.parseUnits("20", 18), actor.address);
        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));

        console.log("> Contract Eth balance %s", await getERC20Balance(oneClickDepositAddress, wethAddress));
        console.log("> Contrac Usdc balance %s", await getERC20Balance(oneClickDepositAddress, usdcAddress));
        console.log("> Contract Osqth balance %s", await getERC20Balance(oneClickDepositAddress, osqthAddress));

        const slippage = "950000000000000000";
        const amountETH = "10000000000000000000";

        console.log("> amount wETH to deposit %s", amountETH);

        tx = await OneClickDeposit.connect(actor).deposit(amountETH, slippage, actorAddress, "0", {
            gasLimit: 1700000,
            gasPrice: 8000000000,
        });

        receipt = await tx.wait();
        console.log("> deposit()");
        console.log("> Gas used: %s", receipt.gasUsed);

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        expect(await getERC20Balance(actor.address, wethAddress)).not.equal("0");
        expect(await getERC20Balance(actor.address, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(actor.address, osqthAddress)).to.equal("0");

        expect(await getERC20Balance(oneClickDepositAddress, wethAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, osqthAddress)).to.equal("0");
    });

    it("flash deposit real (mode = 1)", async function () {
        this.skip();
        // const oneClickDepositAddress = _oneClickDepositAddress;
        const oneClickDepositAddress = OneClickDeposit.address;

        const [owner] = await ethers.getSigners();
        await owner.sendTransaction({
            to: actorAddress,
            value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
        });

        let WETH = await ethers.getContractAt("IWETH", wethAddress);
        tx = await WETH.connect(actor).approve(oneClickDepositAddress, BigNumber.from(maxUint256));
        await tx.wait();
        await getWETH(utils.parseUnits("20", 18), actor.address);
        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));

        console.log("> Contract Eth balance %s", await getERC20Balance(oneClickDepositAddress, wethAddress));
        console.log("> Contract Usdc balance %s", await getERC20Balance(oneClickDepositAddress, usdcAddress));
        console.log("> Contract Osqth balance %s", await getERC20Balance(oneClickDepositAddress, osqthAddress));

        const slippage = "990000000000000000";
        const amountETH = "10000000000000000000";

        console.log("> amount wETH to deposit %s", await getERC20Balance(actor.address, wethAddress));

        tx = await OneClickDeposit.connect(actor).deposit(amountETH, slippage, actorAddress, "1", {
            gasLimit: 1500000,
            gasPrice: 8000000000,
        });

        receipt = await tx.wait();
        console.log("> deposit()");
        console.log("> Gas used: %s", receipt.gasUsed);

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        expect(await getERC20Balance(actor.address, usdcAddress)).not.equal("0");
        expect(await getERC20Balance(actor.address, usdcAddress)).not.equal("0");
        expect(await getERC20Balance(actor.address, osqthAddress)).not.equal("0");

        expect(await getERC20Balance(oneClickDepositAddress, wethAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, osqthAddress)).to.equal("0");
    });
});
