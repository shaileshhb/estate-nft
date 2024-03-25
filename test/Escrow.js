import { expect } from "chai";
import hre from "hardhat";

const tokens = (n) => {
  return hre.ethers.parseUnits(n.toString(), 'ether')
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
    await transaction.wait()

    const Escrow = await hre.ethers.getContractFactory("Escrow")
    escrow = await Escrow.deploy(realEstate.target, seller.address, inspector.address, lender.address)

    // Approve nft
    transaction = await realEstate.connect(seller).approve(escrow.target, 0);
    await transaction.wait()

    // list property
    transaction = await escrow.connect(seller).list(0, tokens(10), tokens(5), buyer.address)
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
    it("Updates as listed", async () => {
      const result = await escrow.isListed(0)
      expect(result).to.be.equal(true)
    })

    it("Returns purchase price", async () => {
      const ownerAddress = await escrow.purchasePrice(0)
      expect(ownerAddress).to.be.equal(tokens(10))
    })

    it("Returns escrow amount", async () => {
      const ownerAddress = await escrow.escrowAmount(0)
      expect(ownerAddress).to.be.equal(tokens(5))
    })

    it("Returns buyer", async () => {
      const ownerAddress = await escrow.buyer(0)
      expect(ownerAddress).to.be.equal(buyer.address)
    })

    it("Update ownership", async () => {
      const ownerAddress = await realEstate.ownerOf(0)
      expect(ownerAddress).to.be.equal(escrow.target)
    })
  })

  describe("Deposits", () => {
    it("Updates contract balances", async () => {
      const transaction = await escrow.connect(buyer).depositEarnest(0, { value: tokens(5) })
      await transaction.wait()

      const result = await escrow.getBalance()
      expect(result).to.be.equal(tokens(5))
    })
  })

  describe("Inspection", () => {
    it("Updates inspection status", async () => {
      const transaction = await escrow.connect(inspector).updateInspectionStatus(0, true)
      await transaction.wait()

      const result = await escrow.inspectionPassed(0)
      expect(result).to.be.equal(true)
    })
  })

  describe("Approval", () => {
    it("Updates approval status", async () => {
      let transaction = await escrow.connect(buyer).approveSale(0)
      await transaction.wait()

      transaction = await escrow.connect(seller).approveSale(0)
      await transaction.wait()

      transaction = await escrow.connect(lender).approveSale(0)
      await transaction.wait()

      expect(await escrow.approval(0, buyer.address)).to.be.equal(true)
      expect(await escrow.approval(0, seller.address)).to.be.equal(true)
      expect(await escrow.approval(0, lender.address)).to.be.equal(true)
    })
  })

  describe("Sale", async () => {
    beforeEach(async () => {
      let transaction = await escrow.connect(buyer).depositEarnest(0, { value: tokens(5) })
      await transaction.wait()

      transaction = await escrow.connect(inspector).updateInspectionStatus(0, true)
      await transaction.wait()

      transaction = await escrow.connect(buyer).approveSale(0)
      await transaction.wait()

      transaction = await escrow.connect(seller).approveSale(0)
      await transaction.wait()

      transaction = await escrow.connect(lender).approveSale(0)
      await transaction.wait()

      await lender.sendTransaction({ to: escrow.target, value: tokens(5) })

      transaction = await escrow.connect(seller).finalizeSale(0)
      await transaction.wait()
    })

    it("Updates balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0)
    })

    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(0)).to.be.equal(buyer.address)
    })
  })
})