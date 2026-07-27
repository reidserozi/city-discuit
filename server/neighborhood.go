package server

import (
	"strings"
	"time"

	"github.com/discuitnet/discuit/core"
	"github.com/discuitnet/discuit/internal/httperr"
)

// GET /api/neighborhoods
func (s *Server) getNeighborhoods(w *responseWriter, r *request) error {
	neighborhoods, err := core.GetNeighborhoods(r.ctx, s.db)
	if err != nil {
		return err
	}

	// Return only public fields (exclude sensitive description)
	type publicNeighborhood struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		Code      string `json:"code"`
		CreatedAt string `json:"createdAt"`
	}

	var publicNeighborhoods []publicNeighborhood
	for _, n := range neighborhoods {
		code := ""
		if n.Code.Valid {
			code = n.Code.String
		}
		publicNeighborhoods = append(publicNeighborhoods, publicNeighborhood{
			ID:        n.ID,
			Name:      n.Name,
			Code:      code,
			CreatedAt: n.CreatedAt.Format(time.RFC3339),
		})
	}

	return w.writeJSON(publicNeighborhoods)
}

// POST /api/admin/neighborhoods
func (s *Server) createNeighborhood(w *responseWriter, r *request) error {
	if _, err := getLoggedInAdmin(s.db, r); err != nil {
		return err
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Code        string `json:"code"`
	}
	if err := r.unmarshalJSONBody(&req); err != nil {
		return err
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.Code = strings.TrimSpace(req.Code)

	if req.Name == "" {
		return httperr.NewBadRequest("invalid_name", "Neighborhood name is required")
	}

	neighborhood, err := core.CreateNeighborhood(r.ctx, s.db, req.Name, req.Description, req.Code)
	if err != nil {
		if err.Error() == "neighborhood_already_exists" {
			return httperr.NewBadRequest("already_exists", "Neighborhood with this name already exists")
		}
		return err
	}

	return w.writeJSON(neighborhood)
}

// PUT /api/admin/neighborhoods/:id
func (s *Server) updateNeighborhood(w *responseWriter, r *request) error {
	if _, err := getLoggedInAdmin(s.db, r); err != nil {
		return err
	}

	neighborhoodID := r.muxVar("id")

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Code        string `json:"code"`
	}
	if err := r.unmarshalJSONBody(&req); err != nil {
		return err
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.Code = strings.TrimSpace(req.Code)

	if req.Name == "" {
		return httperr.NewBadRequest("invalid_name", "Neighborhood name is required")
	}

	// Verify neighborhood exists
	_, err := core.GetNeighborhoodByID(r.ctx, s.db, neighborhoodID)
	if err != nil {
		if err.Error() == "neighborhood_not_found" {
			return httperr.NewNotFound("not_found", "Neighborhood not found")
		}
		return err
	}

	if err := core.UpdateNeighborhood(r.ctx, s.db, neighborhoodID, req.Name, req.Description, req.Code); err != nil {
		return err
	}

	neighborhood, _ := core.GetNeighborhoodByID(r.ctx, s.db, neighborhoodID)
	return w.writeJSON(neighborhood)
}

// DELETE /api/admin/neighborhoods/:id
func (s *Server) deleteNeighborhood(w *responseWriter, r *request) error {
	if _, err := getLoggedInAdmin(s.db, r); err != nil {
		return err
	}

	neighborhoodID := r.muxVar("id")

	// Verify neighborhood exists
	_, err := core.GetNeighborhoodByID(r.ctx, s.db, neighborhoodID)
	if err != nil {
		if err.Error() == "neighborhood_not_found" {
			return httperr.NewNotFound("not_found", "Neighborhood not found")
		}
		return err
	}

	// Check if any users have this neighborhood
	var count int
	err = s.db.QueryRowContext(r.ctx, "SELECT COUNT(*) FROM users WHERE neighborhood_id = ?", neighborhoodID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return httperr.NewBadRequest("in_use", "Cannot delete neighborhood with users")
	}

	if err := core.DeleteNeighborhood(r.ctx, s.db, neighborhoodID); err != nil {
		return err
	}

	return w.writeJSON(map[string]string{"message": "neighborhood_deleted"})
}
