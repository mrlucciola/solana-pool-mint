// modules
import {
  Provider,
  Program,
  getProvider,
  web3,
  // @ts-ignore
  workspace,
  setProvider,
} from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  initEnvironment,
  IDeployer,
  IUser,
  handleTxn,
  TOKEN_DECMIALS,
} from "./utils/utils";
// local
import { Ratio } from "../target/types/ratio";
// general constants
const systemProgram = web3.SystemProgram.programId;
const rent = web3.SYSVAR_RENT_PUBKEY;

setProvider(Provider.local());
const provider: Provider = getProvider();
// @ts-ignore
const programRatio = workspace.Ratio as Program<Ratio>;
console.log(`ratio program ID: ${programRatio.programId.toString()}`);

// test constants
let deployer: IDeployer;
let user1: IUser;
let user2: IUser;

describe("ratio", () => {
  before(async () => {
    // @ts-ignore
    const envObj = await initEnvironment(provider, programRatio);
    deployer = envObj.deployer;
    user1 = envObj.user1;
    user2 = envObj.user2;
    console.log('deployer', deployer.program.programId.toString())
    console.log('state', deployer.state.pda.toString(), deployer.state.bump)
  });

  it("initalize state", async () => {
    if (!await getProvider().connection.getAccountInfo(deployer.state.pda)) {
      const txnState = new web3.Transaction();
      txnState.add(programRatio.instruction.initState(
        deployer.state.bump,
        {
          accounts: {
            authority: deployer.wallet.publicKey,
            state: deployer.state.pda,
            rent,
            systemProgram,
          },
          signers: [deployer.wallet.payer],
        }
      ));
      const confirmation = await handleTxn(txnState, provider, deployer.wallet);
      console.log("initialized state successfully!\n", confirmation, !!(await provider.connection.getAccountInfo(deployer.state.pda)));
    }
  });

  it("initalize pool", async () => {
    if (!await getProvider().connection.getAccountInfo(deployer.currency.mint)) {
      const txnPool = new web3.Transaction();
      txnPool.add(programRatio.instruction.initPool(
        deployer.pool.bump,
        TOKEN_DECMIALS,
        {
          accounts: {
            authority: deployer.wallet.publicKey,
            state: deployer.state.pda,
            pool: deployer.pool.pda,
            poolCurrency: deployer.pool.currency.pda,
            currencyMint: deployer.currency.mint,
            rent,
            systemProgram,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
      ));
      const confirmation = await handleTxn(txnPool, provider, deployer.wallet);
      console.log(
        "Created the pool: successful!\n",
        confirmation,
        !!(await getProvider().connection.getAccountInfo(deployer.currency.mint))
      );
    }
  });

});