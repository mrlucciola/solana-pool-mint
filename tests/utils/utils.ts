// anchor/solana
import {
  web3,
  utils,
  Provider,
  // @ts-ignore
  Wallet,
  Program,
} from "@project-serum/anchor";
// utils
import { sha256 } from "js-sha256";
import {
  Token as SplToken,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { initDeployerAccounts } from "./initializeState";
export const TOKEN_DECMIALS: number = 8;
interface IgenerateSeedsArr {
  name?: string;
  nameSpace?: string;
  otherSeeds?: Buffer[];
}
const generateSeedsArr = ({
  name = "",
  nameSpace = "accounts",
  otherSeeds = [] as Buffer[],
}: IgenerateSeedsArr) => {
  if (name === "") {
    return otherSeeds;
  }
  const seedHash: string = sha256(`${nameSpace}:${name}`);
  const seedDiscriminator: Buffer = Buffer.from(
    seedHash.substring(0, 16),
    "hex"
  );

  const seedsArr = [seedDiscriminator];
  otherSeeds && seedsArr.push(...otherSeeds);
  return seedsArr;
};

export const handleTxn = async (
  txn_: web3.Transaction,
  provider_: Provider,
  wallet_: Wallet,
) => {
  txn_.feePayer = wallet_.publicKey;
  txn_.recentBlockhash = (
    await provider_.connection.getRecentBlockhash()
  ).blockhash;
  const signedTxn: web3.Transaction = await wallet_.signTransaction(txn_);
  const resMain: string = await provider_.send(signedTxn);
  const conf: web3.RpcResponseAndContext<web3.SignatureResult> =
    await provider_.connection.confirmTransaction(resMain);
  return resMain;
};

interface IFindPDA {
  programId: web3.PublicKey;
  name?: string;
  seeds?: Buffer[];
  nameSpace?: string;
}
export const findPDA = ({
  programId,
  name = "",
  seeds = [] as Buffer[],
  nameSpace = "account",
}: IFindPDA) => {
  const seedsArr = generateSeedsArr({ name, nameSpace, otherSeeds: seeds });
  return utils.publicKey.findProgramAddressSync(seedsArr, programId) as [web3.PublicKey, number];
};

export async function getTokenBalance(
  assocToken: web3.PublicKey,
  provider: Provider,
  decimals?: number
) {
  const res: web3.RpcResponseAndContext<web3.TokenAmount> =
    await provider.connection.getTokenAccountBalance(assocToken);

  return decimals
    ? Number(res.value.amount) * 10 ** (-decimals)
    : Number(res.value.amount);
}
export async function getBalance(
  owner: web3.PublicKey,
  mintPda: web3.PublicKey,
  provider: Provider
) {
  const parsedTokenAccountsByOwner =
    await provider.connection.getParsedTokenAccountsByOwner(owner, {
      mint: mintPda,
    });
  let balance: number =
    parsedTokenAccountsByOwner.value[0].account.data.parsed.info.tokenAmount
      .uiAmount;

  return balance;
}

export const getAssocTokenAcctOld = async (
  owner: web3.PublicKey,
  mintPda: web3.PublicKey
) => {
  const assocAcct: web3.PublicKey = await SplToken.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintPda,
    owner,
    true
  );
  return assocAcct as web3.PublicKey;
};

export const getAssocTokenAcct = (
  owner: web3.PublicKey,
  mintPda: web3.PublicKey
) => {
  const [assocAcct, bump] = findPDA({
    seeds: [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPda.toBuffer()],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
  });
  return [assocAcct, bump] as [web3.PublicKey, number];
};

export interface IDeployer {
  provider: Provider;
  program: Program;
  wallet: Wallet;
  state: {
    pda: web3.PublicKey;
    bump: number;
  };
  pool: {
    pda: web3.PublicKey;
    bump: number;
    currency: {
      pda: web3.PublicKey;
      bump: number;
    };
  };
  currency: {
    mint: web3.PublicKey;
    bump: number;
  };
}

export interface IUser {
  keypair: web3.Keypair;
  wallet: Wallet;
  currency: {
    assoc: web3.PublicKey;
    bump: number;
  };
}

export const initEnvironment = async (provider: Provider, program: Program) => {
  const exposedKeypairUser1: Uint8Array = new Uint8Array([
    137, 10, 190, 145, 61, 159, 94, 34, 125, 181, 216, 222, 167, 145, 228, 240,
    85, 23, 195, 65, 231, 85, 64, 71, 3, 62, 17, 109, 147, 64, 129, 182, 240,
    93, 38, 195, 100, 211, 54, 181, 206, 211, 184, 193, 121, 210, 4, 138, 24,
    190, 41, 95, 40, 146, 22, 96, 149, 56, 123, 194, 149, 45, 35, 139,
  ]);
  const exposedKeypairUser2: Uint8Array = new Uint8Array([
    147, 105, 42, 154, 128, 54, 185, 79, 214, 177, 163, 63, 133, 245, 48, 212,
    102, 64, 209, 153, 192, 147, 231, 227, 188, 137, 221, 229, 19, 130, 206, 41,
    84, 43, 222, 215, 242, 166, 59, 115, 188, 88, 244, 148, 145, 206, 193, 207,
    121, 171, 195, 117, 228, 141, 247, 196, 53, 193, 214, 99, 34, 114, 240, 171,
  ]);
  const user1Keypair: web3.Keypair = web3.Keypair.fromSecretKey(exposedKeypairUser1);
  const user2Keypair: web3.Keypair = web3.Keypair.fromSecretKey(exposedKeypairUser2);
  const user1Wallet = new Wallet(user1Keypair);
  const user2Wallet = new Wallet(user2Keypair);

  const { currency, pool, state } = initDeployerAccounts(program);

  // get the associated accounts for our two users
  const [user1CurrencyAssoc, user1CurrencyAssocBump] = getAssocTokenAcct(
    user1Wallet.publicKey,
    currency.mint
  );
  const [user2CurrencyAssoc, user2CurrencyAssocBump] = getAssocTokenAcct(
    user1Wallet.publicKey,
    currency.mint
  );

  // combine everything into a single object
  const user1: IUser = {
    keypair: user1Keypair,
    wallet: user1Wallet,
    currency: {
      assoc: user1CurrencyAssoc,
      bump: user1CurrencyAssocBump,
    },
  };
  const user2: IUser = {
    keypair: user2Keypair,
    wallet: user2Wallet,
    currency: {
      assoc: user2CurrencyAssoc,
      bump: user2CurrencyAssocBump,
    },
  };
  const deployer: IDeployer = {
    state,
    provider,
    program,
    wallet: provider.wallet as Wallet,
    pool,
    currency,
  };
  return { user1, user2, deployer };
};
