// modules
use anchor_lang::{prelude::*, Discriminator};
use anchor_spl::token::{mint_to, MintTo};
// local
pub mod context;
pub use crate::context::*;
pub mod state;
pub use crate::state::{State, Pool};

declare_id!("6cDMc7baVfghT4sUx1t3sEfohxXyj4XwDr8pbarQfz1z");

// main
#[program]
pub mod pool_mint {
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
    pub fn mint_and_deposit(ctx: Context<MintAndDeposit>, mint_amount: u64) -> ProgramResult {
        let current_time = Clock::get().expect("Failed").unix_timestamp;

        if current_time - ctx.accounts.state.last_minted > 60 {
            let state_seed: &[&[&[u8]]] =
                &[&[&State::discriminator()[..], &[ctx.accounts.state.bump]]];
            let mint_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.currency_mint.to_account_info(),
                    to: ctx.accounts.dest_currency.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                },
                state_seed,
            );

            // mint
            mint_to(mint_ctx, mint_amount)?;

            // set new mint time
            ctx.accounts.state.last_minted = current_time;
        } else {
            msg!("Need to wait 1 minute");
            return Err(ErrorCode::TimeDelay)?;
        }

        Ok(())
    }
}

#[error]
pub enum ErrorCode {
    #[msg("Please wait 60 seconds")]
    TimeDelay,
}
