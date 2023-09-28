const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = EthUsdAggregator.target
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }
    log("----------------------------------------------------")
    const lowSvg = await fs.readFileSync("./images/dynamicNft/frown.svg", {
        encoding: "utf-8",
    })
    const highSvg = await fs.readFileSync("./images/dynamicNft/happy.svg", {
        encoding: "utf-8",
    })

    const args = [ethUsdPriceFeedAddress, lowSvg, highSvg]

    const dynamicNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("----------------------------------------------------")
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying on Etherscan")

        await verify(dynamicNft.address, args)
    }
    log("------------------------------------")
}

module.exports.tags = ["all", "dynamicsvg", "main"]
