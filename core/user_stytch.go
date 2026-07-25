package core

import (
	"context"
	"database/sql"
	"time"

	msql "github.com/discuitnet/discuit/internal/sql"
	"github.com/discuitnet/discuit/internal/uid"
)

func (u *User) SetStytchUserID(ctx context.Context, db *sql.DB, stytchUserID string) error {
	if u.Deleted {
		return ErrUserDeleted
	}
	_, err := db.ExecContext(ctx, "UPDATE users SET stytch_user_id = ? WHERE id = ?", stytchUserID, u.ID)
	if err == nil {
		u.StytchUserID = msql.NewNullString(stytchUserID)
	}
	return err
}

func (u *User) SetEmailConfirmed(ctx context.Context, db *sql.DB, confirmed bool) error {
	if u.Deleted {
		return ErrUserDeleted
	}
	var emailConfirmedAt msql.NullTime
	if confirmed {
		emailConfirmedAt = msql.NewNullTime(time.Now())
	}
	_, err := db.ExecContext(ctx, "UPDATE users SET email_confirmed_at = ? WHERE id = ?", emailConfirmedAt, u.ID)
	if err == nil {
		u.EmailConfirmedAt = emailConfirmedAt
	}
	return err
}

func (u *User) SetMFAEnabled(ctx context.Context, db *sql.DB, enabled bool) error {
	if u.Deleted {
		return ErrUserDeleted
	}
	_, err := db.ExecContext(ctx, "UPDATE users SET mfa_enabled = ? WHERE id = ?", enabled, u.ID)
	if err == nil {
		u.MFAEnabled = enabled
	}
	return err
}

func (u *User) ResetPassword(ctx context.Context, db *sql.DB, newPassword string) error {
	if u.Deleted {
		return ErrUserDeleted
	}
	hash, err := HashPassword([]byte(newPassword))
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, "UPDATE users SET password = ? WHERE id = ?", hash, u.ID)
	if err == nil {
		u.Password = string(hash)
	}
	return err
}

func GetUserByStytchUserID(ctx context.Context, db *sql.DB, stytchUserID string, viewer *uid.ID) (*User, error) {
	rows, err := db.QueryContext(ctx, buildSelectUserQuery("WHERE users.stytch_user_id = ?"), stytchUserID)
	if err != nil {
		return nil, err
	}
	users, err := scanUsers(ctx, db, rows, viewer)
	if err != nil {
		return nil, err
	}
	return users[0], err
}
