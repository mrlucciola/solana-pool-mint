// modules
import {
  Provider,
  Program,
  getProvider,
  web3,
  // @ts-ignore
  workspace,
  setProvider,
  BN,
} from "@project-serum/anchor";
import {
  Token as SplToken,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  initEnvironment,
  IDeployer,
  IUser,
  handleTxn,
  TOKEN_DECMIALS,
  getTokenBalance,
} from "./utils/utils";
// local
import { PoolMint } from "../target/types/pool_mint";
// general constants
const systemProgram = web3.SystemProgram.programId;
const rent = web3.SYSVAR_RENT_PUBKEY;
const mintAmount = 3.14 * 10 ** TOKEN_DECMIALS;

setProvider(Provider.local());
const provider: Provider = getProvider();
// @ts-ignore
const programMintCpi = workspace.MintAndDeposit as Program<MintAndDeposit>;
const programPoolMint = workspace.PoolMint as Program<PoolMint>;
console.log(`PoolMint program ID: ${programPoolMint.programId.toString()}`);
console.log(`mintCpi program ID: ${programMintCpi.programId.toString()}`);

// test constants
let deployer: IDeployer;
let user1: IUser;
let user2: IUser;

describe("PoolMint", () => {
  before(async () => {
    // @ts-ignore
    const envObj = await initEnvironment(provider, programPoolMint);
    deployer = envObj.deployer;
    user1 = envObj.user1;
    user2 = envObj.user2;
    console.log('deployer', deployer.program.programId.toString())
    console.log('state', deployer.state.pda.toString(), deployer.state.bump)
  });

  it("initalize state", async () => {
    if (!await getProvider().connection.getAccountInfo(deployer.state.pda)) {
      const txnState = new web3.Transaction();
      txnState.add(programPoolMint.instruction.initState(
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
      txnPool.add(programPoolMint.instruction.initPool(
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

  it('init user account', async () => {
    if (!await getProvider().connection.getAccountInfo(user1.currency.assoc)) {
      const txnUserAssoc = new web3.Transaction();
      txnUserAssoc.add(
        SplToken.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          deployer.currency.mint,
          user1.currency.assoc,
          user1.wallet.publicKey,
          user1.wallet.publicKey,
        )
      );
      try {
        const confirmationUserAssoc = await handleTxn(txnUserAssoc, provider, user1.wallet);
        console.log('user assoc initialized!', confirmationUserAssoc);
      } catch (error) {
        console.log(error)
        process.exit()
      }
    }
  });

  it("mint to pool cpi", async () => {
    const txnMint = new web3.Transaction();
    const poolBalancePre = await getTokenBalance(deployer.pool.currency.pda, provider);

    txnMint.add(programMintCpi.instruction.mintAndDepositCpi(
      new BN(Number(mintAmount)),
      {
        accounts: {
          state: deployer.state.pda,
          currencyMint: deployer.currency.mint,
          destCurrency: deployer.pool.currency.pda,
          tokenProgram: TOKEN_PROGRAM_ID,
          poolMintProgram: programPoolMint.programId,
        },
      }
    ));
    try {
      const confirmation = await handleTxn(txnMint, provider, deployer.wallet);
      console.log("Pool: Mint To Address confirmation: ", confirmation);
    } catch (e) {
      console.log(e)
      console.log(e.code, e.msg);
    }
    const poolBalancePost = await getTokenBalance(deployer.pool.currency.pda, provider);
    console.log(
      `mint to pool (Mint To Address) Pool:\n after - before = ${poolBalancePost} - ${poolBalancePre} = ${
        poolBalancePost - poolBalancePre
      } = ${mintAmount} ? ${
        mintAmount === poolBalancePost - poolBalancePre
      }\n`
    );
  });

});