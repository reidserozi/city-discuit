package core

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/discuitnet/discuit/internal/email"
)

// The guards must run before the mailer is touched, and must stay
// distinguishable by the caller so an admin is told why nothing was sent
// rather than getting a generic failure.
func TestSendNeighborhoodCodeEmailGuards(t *testing.T) {
	full := func() *Neighborhood {
		return &Neighborhood{
			Name:         "Oakdale",
			Code:         sql.NullString{String: "9442", Valid: true},
			ContactEmail: sql.NullString{String: "leader@example.com", Valid: true},
		}
	}

	setEmail := func(enabled bool, svc *email.Service) {
		emailMutex.Lock()
		defer emailMutex.Unlock()
		emailNotifsEnabled, emailService = enabled, svc
	}
	t.Cleanup(func() { setEmail(false, nil) })

	t.Run("email disabled", func(t *testing.T) {
		setEmail(false, nil)
		if err := SendNeighborhoodCodeEmail(full()); !errors.Is(err, ErrEmailNotEnabled) {
			t.Fatalf("got %v, want ErrEmailNotEnabled", err)
		}
	})

	// Enabled from here on. These cases must return before reaching Send, so
	// the service is never actually dialled.
	setEmail(true, email.New("127.0.0.1", 587, "u", "p", "from@example.com", "Name"))

	incomplete := map[string]func(*Neighborhood){
		"no code":          func(n *Neighborhood) { n.Code = sql.NullString{} },
		"empty code":       func(n *Neighborhood) { n.Code = sql.NullString{String: "", Valid: true} },
		"no contact email": func(n *Neighborhood) { n.ContactEmail = sql.NullString{} },
		"empty email":      func(n *Neighborhood) { n.ContactEmail = sql.NullString{String: "", Valid: true} },
	}
	for name, breakIt := range incomplete {
		t.Run(name, func(t *testing.T) {
			n := full()
			breakIt(n)
			if err := SendNeighborhoodCodeEmail(n); !errors.Is(err, ErrNeighborhoodCodeEmailMiss) {
				t.Fatalf("got %v, want ErrNeighborhoodCodeEmailMiss", err)
			}
		})
	}
}
