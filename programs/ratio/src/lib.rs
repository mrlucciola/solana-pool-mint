use anchor_lang::prelude::*;
pub mod context;
pub use crate::context::*;
pub mod state;
pub use crate::state::{State, Pool};

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
    pub fn init_pool(ctx: Context<InitPool>, pool_bump: u8, decimals: u8) -> ProgramResult {
        ctx.accounts.pool.bump = pool_bump;
        ctx.accounts.pool.pool_currency = ctx.accounts.pool_currency.key();
        ctx.accounts.pool.currency_mint = ctx.accounts.currency_mint.key();

        Ok(())
    }
}
