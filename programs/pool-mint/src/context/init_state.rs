use anchor_lang::{prelude::*, Discriminator};
use crate::state::State;

#[derive(Accounts)]
#[instruction(state_bump: u8)]
pub struct InitState<'info> {
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer=authority,
        seeds=[&State::discriminator()[..]],
        bump=state_bump,
    )]
    pub state: Account<'info, State>,
}
