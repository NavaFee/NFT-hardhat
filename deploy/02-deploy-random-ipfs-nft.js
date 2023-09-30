const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft/"
let tokenUris = [
    "ipfs://QmcQbzp6gjkzXmXVhE1Bs2NhBWuGQBszJ86BVLaFMmWJfA",
    "ipfs://QmcdLLVTfi2K1UgDgsMKEXKmw7NV74LL7AusMyT9J8UeEi",
    "ipfs://QmWYjYXuMfQGrSqpd4f3Ljp8zAGwoz5YnfWEcYP4nDY8MZ",
]

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // get the IPFS hashes of our images

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    // 1. With our own IPFS node.
    // 2. Pinata
    // 3. nft.Storage

    let vrfCoordinatorV2Address

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)

        subscriptionId = txReceipt.logs[0].args[0]

        // Fund the subscription
        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            ethers.parseEther("30")
        )
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("----------------------------------------------------")

    await storeImages(imagesLocation)

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        await vrfCoordinatorV2Mock.addConsumer(
            subscriptionId,
            randomIpfsNft.address
        )
    }
    log("----------------------------------------------------")
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying on Etherscan")

        await verify(randomIpfsNft.address, args)
    }
    log("------------------------------------")
}

async function handleTokenUris() {
    tokenUris = []

    // store the Image in IPFS
    // store the metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(
        imagesLocation
    )
    for (imageUploadResponsesIndex in imageUploadResponses) {
        // create metadata
        // upload the metadata
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(
            ".png",
            ""
        )
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} NFT`
        tokenUriMetadata.image = ` ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
        console.log(`Uploading metadata for ${tokenUriMetadata.name} ...`)
        // store the JSON to pinata / IPFS
        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        )
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs Uploaded! They are:")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
