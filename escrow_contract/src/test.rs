#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{token, Address, Env, String};

#[test]
fn test_escrow_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    // Register a token for testing
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin.clone());
    let token = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    // Mint some tokens to client
    token_admin_client.mint(&user_client, &1000);
    assert_eq!(token.balance(&user_client), 1000);

    // 1. Post Job
    let title = String::from_str(&env, "Test Job");
    let desc = String::from_str(&env, "Job description");
    let amount = 500i128;

    let job_id = client.post_job(&user_client, &title, &desc, &amount, &token_address);
    assert_eq!(job_id, 1);
    assert_eq!(token.balance(&user_client), 500);
    assert_eq!(token.balance(&contract_id), 500);

    // Verify job data
    let job = client.get_job(&job_id);
    assert_eq!(job.client, user_client);
    assert_eq!(job.status, JobStatus::Open);

    // 2. Accept Job
    client.accept_job(&freelancer, &job_id);
    let job = client.get_job(&job_id);
    assert_eq!(job.freelancer, freelancer);
    assert_eq!(job.status, JobStatus::InProgress);

    // 3. Submit Work
    let work_url = String::from_str(&env, "https://github.com/mywork");
    client.submit_work(&freelancer, &job_id, &work_url);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Submitted);
    assert_eq!(job.work_url, work_url);

    // 4. Approve and Pay
    client.approve_and_pay(&user_client, &job_id);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Completed);
    assert_eq!(token.balance(&freelancer), 500);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_cancel_job() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    let user_client = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin);
    let token = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    token_admin_client.mint(&user_client, &1000);

    let job_id = client.post_job(
        &user_client, 
        &String::from_str(&env, "Title"), 
        &String::from_str(&env, "Desc"), 
        &500, 
        &token_address
    );

    // Cancel
    client.cancel_job(&user_client, &job_id);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Cancelled);
    assert_eq!(token.balance(&user_client), 1000);
}
