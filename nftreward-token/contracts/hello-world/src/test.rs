#![cfg(test)]

use super::*;
use soroban_sdk::{Env, Address, testutils::Address as _};

#[test]
fn test() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, NFTRewardToken);
    let client = NFTRewardTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);
    client.mint(&user, &100);

    assert_eq!(client.balance(&user), 100);
}
