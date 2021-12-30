use anchor_lang::prelude::*;
pub mod context;
pub use crate::context::*;
pub mod state;
pub use crate::state::State;

declare_id!("6cDMc7baVfghT4sUx1t3sEfohxXyj4XwDr8pbarQfz1z");

#[program]
pub mod ratio {
    use super::*;

    pub fn init_state(ctx: Context<InitState>, state_bump: u8) -> ProgramResult {
        ctx.accounts.state.bump = state_bump;
        ctx.accounts.state.authority = ctx.accounts.authority.key();
        ctx.accounts.state.last_minted = 0;

        Ok(())
    }
    // pub fn init_pool(ctx: Context<InitPool>) -> ProgramResult {
    //     Ok(())
    // }
}
