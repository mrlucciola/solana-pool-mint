import { Program } from "@project-serum/anchor";
import { findPDA } from "./utils";

// UTILITY FUNCTIONS
export const initDeployerAccount = (program: Program) => {
  const [statePda, stateBump] = findPDA({
    programId: program.programId,
    name: "State",
  });

  return {
    state: {
      pda: statePda,
      bump: stateBump,
    },
  };
};
