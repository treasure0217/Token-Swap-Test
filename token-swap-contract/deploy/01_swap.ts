import { DeployFunction } from "hardhat-deploy/types";
import { Ship } from "../utils";
import { TokenSwap__factory } from "../types";

const func: DeployFunction = async (hre) => {
  const { deploy } = await Ship.init(hre);

  await deploy(TokenSwap__factory);
};

export default func;
func.tags = ["swap"];
func.dependencies = ["mocks"];
