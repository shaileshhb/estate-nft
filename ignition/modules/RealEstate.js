const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");
// import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
// import hre from "hardhat";

const JAN_1ST_2030 = 1893456000;
const ONE_GWEI = 1_000_000_000n;

async function deployRealEstate() {
  const [buyer, seller, inspector, lender] = await hre.ethers.getSigners();

  const RealEstate = await hre.ethers.getContractFactory("RealEstate")
  let realEstate = await RealEstate.deploy(seller.address)
  await realEstate.deployed();

  for (let index = 0; index < 3; index++) {
    const nftUrl = `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${(index + 1)}.json`
    let transaction = await realEstate.connect(seller).safeMint(seller.address, nftUrl)
    await transaction.wait()
  }
}

module.exports = buildModule("RealEstateModule", (m) => {
  const unlockTime = m.getParameter("unlockTime", JAN_1ST_2030);
  const lockedAmount = m.getParameter("lockedAmount", ONE_GWEI);

  // const realEstate = m.contract("RealEstate", [unlockTime], {
  //   value: lockedAmount,
  // });

  deployRealEstate()

  return { };
});
