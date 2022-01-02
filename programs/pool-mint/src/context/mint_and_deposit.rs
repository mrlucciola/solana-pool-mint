use anchor_lang::prelude::*;
pub use anchor_lang::Discriminator;
use anchor_spl::token::{TokenAccount, Mint, Token};
// local
use crate::state::State;

#[derive(Accounts)]
pub struct MintAndDeposit<'info> {
    #[account(mut, seeds=[&State::discriminator()[..]], bump=state.bump)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub currency_mint: Account<'info, Mint>,
    #[account(mut, constraint= dest_currency.mint == currency_mint.key())]
    pub dest_currency: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
