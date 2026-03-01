#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Env, Address, Map};

#[contracttype]
pub enum DataKey {
    Admin,
    Balances,
}

#[contract]
pub struct NFTRewardToken;

#[contractimpl]
impl NFTRewardToken {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().persistent()
            .get(&DataKey::Admin)
            .unwrap();

        admin.require_auth();

        let mut balances: Map<Address, i128> =
            env.storage().persistent().get(&DataKey::Balances).unwrap_or(Map::new(&env));

        let current = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), current.checked_add(amount).expect("balance overflow"));

        env.storage().persistent().set(&DataKey::Balances, &balances);
    }

    pub fn balance(env: Env, user: Address) -> i128 {
        let balances: Map<Address, i128> =
            env.storage().persistent().get(&DataKey::Balances).unwrap_or(Map::new(&env));

        balances.get(user).unwrap_or(0)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        let mut balances: Map<Address, i128> =
            env.storage().persistent().get(&DataKey::Balances).unwrap_or(Map::new(&env));

        let from_balance = balances.get(from.clone()).unwrap_or(0);

        if from_balance < amount {
            panic!("insufficient balance");
        }

        balances.set(from.clone(), from_balance.checked_sub(amount).expect("balance underflow"));
        let to_balance = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), to_balance.checked_add(amount).expect("balance overflow"));

        env.storage().persistent().set(&DataKey::Balances, &balances);
    }
}