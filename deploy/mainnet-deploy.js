const { ethers } = require("hardhat");
const { utils } = ethers;
const { BigNumber } = require("ethers");

const governance = "0x42B1299fCcA091A83C08C24915Be6E6d63906b1a";

const mainnetDeploymentParams = [
    utils.parseUnits("100", 18),
    BigNumber.from(43200),
    utils.parseUnits("0.1", 18),
    BigNumber.from("600"),
    BigNumber.from("950000000000000000"),
    BigNumber.from("1050000000000000000"),
    BigNumber.from("0"),
];

mainnetDeploymentParams.map((i) => console.log(i.toString()));

const hardhatDeploy = async (governance, params) => {
    const UniswapMath = await deployContract("UniswapMath", []);
    const Vault = await deployContract("Vault", []);
    const VaultAuction = await deployContract("VaultAuction", []);
    const VaultMath = await deployContract("VaultMath", []);
    const VaultTreasury = await deployContract("VaultTreasury", []);

    params.push(governance);
    const VaultStorage = await deployContract("VaultStorage", params);

    const arguments = [
        UniswapMath.address,
        Vault.address,
        VaultAuction.address,
        VaultMath.address,
        VaultTreasury.address,
        VaultStorage.address,
    ];
    console.log("UniswapMath:", arguments[0]);
    console.log("Vault:", arguments[1]);
    console.log("VaultAuction:", arguments[2]);
    console.log("VaultMath:", arguments[3]);
    console.log("VaultTreasury:", arguments[4]);
    console.log("VaultStorage:", arguments[5]);

    let tx;
    tx = await Vault.setComponents(...arguments);
    await tx.wait();
    tx = await VaultAuction.setComponents(...arguments);
    await tx.wait();
    tx = await VaultMath.setComponents(...arguments);
    await tx.wait();
    tx = await VaultTreasury.setComponents(...arguments);
    await tx.wait();
    tx = await VaultStorage.setComponents(...arguments);
    await tx.wait();
};

const deployContract = async (name, params, deploy = true) => {
    console.log("Deploying ->", name);
    const Contract = await ethers.getContractFactory(name);
    let contract = await Contract.deploy(...params);
    if (deploy) {
        await contract.deployed();
    }
    return contract;
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
hardhatDeploy(governance, mainnetDeploymentParams).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

//Link https://www.google.com/search?q=deploy+harhat+on+mainnet&oq=deploy+harhat+on+mainnet&aqs=chrome..69i57j33i10i160.4040j0j7&sourceid=chrome&ie=UTF-8#kpvalbx=_pfvXYtSVEqiF9u8Pj-ax0Ag14
// npx harhat verify 0xd83083740c024445f1BEe2Dad6c86E909491b401 --network ropsten
