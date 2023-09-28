const { network, ethers } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

const BASE_FEE = ethers.parseEther("0.25") // 0.25 Link is the premium. It costs 0.25 link per request
const GAS_PRICE_LINK = 1e9 // link per gas // calculated value based on the gas price of the chain.

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log(" Local Network Detected! Deploying Mocks ... ")

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("Mocks Deployer!")
        log("----------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
