pub use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct State {
    pub bump: u8,
    pub authority: Pubkey,
    pub last_minted: i64,
}

#[account]
#[derive(Default)]
pub struct Pool {
    pub bump: u8,
    pub pool_currency: Pubkey,
    pub currency_mint: Pubkey,
}
