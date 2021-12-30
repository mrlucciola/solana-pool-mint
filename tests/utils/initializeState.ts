import { Program } from "@project-serum/anchor";
import { findPDA } from "./utils";

// UTILITY FUNCTIONS
export const initDeployerAccounts = (program: Program) => {
  const [statePda, stateBump] = findPDA({
    programId: program.programId,
    name: "State",
  });

  const [currencyMintPda, currencyMintBump] = findPDA({
    programId: program.programId,
    seeds: [Buffer.from("CURRENCY_MINT")],
  });

  const [poolPda, poolBump] = findPDA({
    programId: program.programId,
    name: "Pool",
    seeds: [currencyMintPda.toBuffer()],
  });

  const [poolCurrencyPda, poolCurrencyAssocBump] = findPDA({
    seeds: [
      poolPda.toBuffer(),
      currencyMintPda.toBuffer(),
    ],
    programId: program.programId,
  });

  return {
    state: {
      pda: statePda,
      bump: stateBump,
    },
    currency: {
      mint: currencyMintPda,
      bump: currencyMintBump,
    },
    pool: {
      pda: poolPda,
      bump: poolBump,
      currency: {
        pda: poolCurrencyPda,
        bump: poolCurrencyAssocBump,
      },
    },
  };
};
