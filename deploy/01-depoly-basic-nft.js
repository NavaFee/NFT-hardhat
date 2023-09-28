const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    const args = []
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying on Etherscan")
        console.log("basicNft", basicNft)
        console.log("basicNft.target", basicNft.target)
        console.log("basicNft.address", basicNft.address)

        await verify(basicNft.address, args)
    }
    log("------------------------------------")
}

module.exports.tags = ["all", "basicNft", "main"]
