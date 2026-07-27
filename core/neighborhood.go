package core

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/discuitnet/discuit/internal/uid"
)

type Neighborhood struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Code        sql.NullString `json:"-"`
	CreatedAt   time.Time      `json:"createdAt"`
}

// MarshalJSON customizes JSON marshaling for Neighborhood
func (n Neighborhood) MarshalJSON() ([]byte, error) {
	type Alias Neighborhood
	code := ""
	if n.Code.Valid {
		code = n.Code.String
	}
	return json.Marshal(&struct {
		Code string `json:"code"`
		*Alias
	}{
		Code:  code,
		Alias: (*Alias)(&n),
	})
}

// GetNeighborhoods returns all neighborhoods
func GetNeighborhoods(ctx context.Context, db *sql.DB) ([]Neighborhood, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, name, description, code, created_at
		FROM neighborhoods
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var neighborhoods []Neighborhood
	for rows.Next() {
		var n Neighborhood
		if err := rows.Scan(&n.ID, &n.Name, &n.Description, &n.Code, &n.CreatedAt); err != nil {
			return nil, err
		}
		neighborhoods = append(neighborhoods, n)
	}
	return neighborhoods, rows.Err()
}

// GetNeighborhoodByID returns a neighborhood by ID
func GetNeighborhoodByID(ctx context.Context, db *sql.DB, id string) (*Neighborhood, error) {
	var n Neighborhood
	err := db.QueryRowContext(ctx, `
		SELECT id, name, description, code, created_at
		FROM neighborhoods
		WHERE id = ?
	`, id).Scan(&n.ID, &n.Name, &n.Description, &n.Code, &n.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, errors.New("neighborhood_not_found")
	}
	if err != nil {
		return nil, err
	}
	return &n, nil
}

// CreateNeighborhood creates a new neighborhood
func CreateNeighborhood(ctx context.Context, db *sql.DB, name string, description string, code string) (*Neighborhood, error) {
	// Check if neighborhood with this name already exists
	var existingID string
	err := db.QueryRowContext(ctx, `SELECT id FROM neighborhoods WHERE name = ?`, name).Scan(&existingID)
	if err == nil {
		// Neighborhood already exists
		return nil, errors.New("neighborhood_already_exists")
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	id := uid.New()
	codeNullString := sql.NullString{String: code, Valid: code != ""}

	n := Neighborhood{
		ID:          id.String(),
		Name:        name,
		Description: description,
		Code:        codeNullString,
		CreatedAt:   time.Now().UTC(),
	}

	_, err = db.ExecContext(ctx, `
		INSERT INTO neighborhoods (id, name, description, code, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, n.ID, n.Name, n.Description, codeNullString, n.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &n, nil
}

// UpdateNeighborhood updates a neighborhood
func UpdateNeighborhood(ctx context.Context, db *sql.DB, id string, name string, description string, code string) error {
	codeNullString := sql.NullString{String: code, Valid: code != ""}

	_, err := db.ExecContext(ctx, `
		UPDATE neighborhoods
		SET name = ?, description = ?, code = ?
		WHERE id = ?
	`, name, description, codeNullString, id)
	return err
}

// DeleteNeighborhood deletes a neighborhood
func DeleteNeighborhood(ctx context.Context, db *sql.DB, id string) error {
	_, err := db.ExecContext(ctx, `DELETE FROM neighborhoods WHERE id = ?`, id)
	return err
}

// ValidateNeighborhoodCode verifies that the provided code matches the neighborhood's invite code.
// If the neighborhood has no code set (code is NULL), any code is accepted.
// Returns an error with message "invalid_neighborhood_code" if the code doesn't match a neighborhood with a required code.
func ValidateNeighborhoodCode(ctx context.Context, db *sql.DB, neighborhoodID string, code string) error {
	n, err := GetNeighborhoodByID(ctx, db, neighborhoodID)
	if err != nil {
		return err
	}

	// If the neighborhood has a code set, it must match exactly.
	if n.Code.Valid && n.Code.String != code {
		return errors.New("invalid_neighborhood_code")
	}

	return nil
}
