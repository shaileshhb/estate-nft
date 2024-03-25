import { expect } from "chai";
import hre from "hardhat";

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
  let buyer, seller, inspector, lender
  let realEstate, escrow

  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await hre.ethers.getSigners()

    const nftUrl = "https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json"

    // Deploy
    const RealEstate = await hre.ethers.getContractFactory("RealEstate")
    realEstate = await RealEstate.deploy(seller.address)

    // Mint
    let transaction = await realEstate.connect(seller).safeMint(seller.address, nftUrl)
    // let transaction = await realEstate.safeMint(seller.address, nftUrl)
    await transaction.wait()

    const Escrow = await hre.ethers.getContractFactory("Escrow")
    escrow = await Escrow.deploy(realEstate.target, seller.address, inspector.address, lender.address)

    // Approve nft
    transaction = await realEstate.connect(seller).approve(escrow.target, 0);
    await transaction.wait()

    // list property
    transaction = await escrow.connect(seller).list(0)
    await transaction.wait()
  })

  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const result = await escrow.nftAddress()
      expect(result).to.be.equal(realEstate.target);
    })

    it("Returns seller address", async () => {
      const result = await escrow.seller()
      expect(result).to.be.equal(seller.address);
    })

    it("Returns inspector address", async () => {
      const result = await escrow.inspector()
      expect(result).to.be.equal(inspector.address);
    })

    it("Returns lender address", async () => {
      const result = await escrow.lender()
      expect(result).to.be.equal(lender.address);
    })
  })

  describe("Listing", () => {
    it("Update ownership", async () => {
      const ownerAddress = await realEstate.ownerOf(0)
      expect(ownerAddress).to.be.equal(escrow.target)
    })
  })
})