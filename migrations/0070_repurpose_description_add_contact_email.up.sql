alter table neighborhoods
    change column description contact_name text;

alter table neighborhoods
    add column contact_email varchar(255) default null;
