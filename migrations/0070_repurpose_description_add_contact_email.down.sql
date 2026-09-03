alter table neighborhoods
    drop column contact_email;

alter table neighborhoods
    change column contact_name description text;
