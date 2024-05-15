import { DeployFunction } from "hardhat-deploy/types";
import { Ship } from "../utils";
import { MockERC20__factory } from "../types";

const func: DeployFunction = async (hre) => {
  const { deploy } = await Ship.init(hre);

  if (hre.network.tags.test) {
    await deploy(MockERC20__factory, {
      aliasName: "Token1",
      args: ["Token1", "Token1"],
    });
    await deploy(MockERC20__factory, {
      aliasName: "Token2",
      args: ["Token2", "Token2"],
    });
  }
};

export default func;
func.tags = ["mocks"];
