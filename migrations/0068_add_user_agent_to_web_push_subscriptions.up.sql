alter table web_push_subscriptions
    add column user_agent varchar(255) null after updated_at;
